import { and, desc, eq, gte, isNull, sql } from "drizzle-orm"
import { db } from "../../db"

import {
  CommunityJoinRequest,
  CommunityMember,
  NewCommunity,
  communities,
  communityJoinRequests,
  communityMembers,
  postComments,
  postReactions,
  posts,
  users,
} from "../../db/schema"
import {
  ApiError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
} from "../../errors"
import {
  CommunityJoinRequestData,
  CommunityLinkData,
  CommunityListData,
  CommunityMemberData,
  CommunitySearchData,
  JoinResult,
  JoinResultType,
  LeaveResult,
  LeaveResultType,
} from "../../types/community"
import { CommunityPostData, LatestPostsData } from "../../types/post"

const latestPostColumns = sql`
${posts.id} as post_id,
${posts.title} as post_title,
${posts.content} as post_content,
${posts.createdAt} as post_created_at,
${communities.id} as community_id,
${communities.title} as community_title,
${communities.url_title} as community_url_title,
${users.id} as user_id,
${users.name} as user_name,
${users.avatarUrl} as user_avatar_url`

export const communityService = {
  pageSize: 25,
  fuzzySearchCache: [] as CommunitySearchData[],
  maxFuzzySearchCacheSize: 100,

  async getLatestPosts(userId?: string, _page = 0): Promise<LatestPostsData[] | void> {
    try {
      const query = sql`
          select
            ${latestPostColumns}
          from ${posts}
            inner join ${communities} on ${posts.communityId} = ${communities.id}
            inner join ${users} on ${posts.ownerId} = ${users.id}
          where
            ${posts.disabled} = false
            and ${posts.deleted} = false
            and ${communities.disabled} = false
            and ${communities.deleted} = false
            and ${communities.private} = false
        `
      if (userId) {
        query.append(sql` UNION
          select
            ${latestPostColumns}
          from ${posts}
            inner join ${communities} on ${posts.communityId} = ${communities.id}
            inner join ${users} on ${posts.ownerId} = ${users.id}
            inner join ${communityMembers} on 
                  ${communityMembers.communityId} = ${communities.id}
              and ${communityMembers.userId} = ${userId}
              and ${communityMembers.disabled} = false
          where
            ${posts.disabled} = false
            and ${posts.deleted} = false
            and ${communities.disabled} = false
            and ${communities.deleted} = false
            and ${communities.private} = true `)
      }
      query.append(
        sql`order by post_created_at desc limit ${this.pageSize} offset ${_page * this.pageSize}`
      )

      return (await db.execute(query)).map((item) => ({
        post: {
          id: item.post_id as string,
          title: item.post_title as string,
          content: item.post_content as string,
          createdAt: item.post_created_at as string,
        },
        community: {
          id: item.community_id as string,
          title: item.community_title as string,
          url_title: item.community_url_title as string,
        },
        user: {
          id: item.user_id as string,
          name: item.user_name as string,
          avatarUrl: item.user_avatar_url as string,
        },
      }))
    } catch (error) {
      console.error(error)
      return
    }
  },

  async fuzzySearchCommunity(title: string): Promise<CommunitySearchData | void> {
    //https://www.freecodecamp.org/news/fuzzy-string-matching-with-postgresql/
    //https://www.postgresql.org/docs/current/pgtrgm.html
    try {
      let cached = this.fuzzySearchCache.find((item) => item.search === title)
      if (cached) return cached

      const res = await db
        .select({
          title: communities.title,
          url_title: communities.url_title,
          similarity: sql<number>`SIMILARITY(title,${`%${title}%`})`.as("similarity"),
        })
        .from(communities)
        .where(({ similarity }) =>
          and(
            eq(communities.disabled, false),
            eq(communities.deleted, false),
            gte(similarity, 0.15)
          )
        )
        .orderBy(({ similarity }) => desc(similarity))
        .limit(this.pageSize)
        .execute()

      if (!res) return

      cached = this.fuzzySearchCache.find((item) => item.search === title)
      if (cached) {
        cached.communities = res as CommunityLinkData[]
        return cached
      }

      const newCacheItem = {
        search: title,
        communities: res,
      } as CommunitySearchData

      if (this.fuzzySearchCache.length >= this.maxFuzzySearchCacheSize) {
        this.fuzzySearchCache.pop()
      }
      this.fuzzySearchCache.unshift(newCacheItem)
      return newCacheItem
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getCommunity(titleOrId: string, useId: boolean = false) {
    try {
      return await db.query.communities.findFirst({
        where: (community, { eq, and }) =>
          and(
            eq(useId ? community.id : community.url_title, titleOrId),
            eq(community.disabled, false),
            eq(community.deleted, false)
          ),
      })
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getCommunityWithMembers(titleOrId: string, useId: boolean = false) {
    try {
      return await db.query.communities.findFirst({
        where: (community, { eq, and }) =>
          and(
            eq(useId ? community.id : community.url_title, titleOrId),
            eq(community.disabled, false),
            eq(community.deleted, false)
          ),
        with: {
          owners: {
            limit: 1,
            where: (members, { eq }) => eq(members.memberType, "owner"),
            with: { user: true },
          },
          moderators: {
            limit: 3,
            where: (members, { eq }) => eq(members.memberType, "moderator"),
            with: { user: true },
          },
          members: {
            limit: 10,
            where: (members, { eq }) => eq(members.memberType, "member"),
            with: { user: true },
          },
        },
      })
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getCommunityPosts(communityId: string, userId?: string, _page = 0) {
    const numPosts = 10
    const numPostComments = 5
    try {
      const query = sql`
        with top_posts as (
          select
            ${posts.id} as post_id,
            ${posts.title} as post_title,
            ${posts.content} as post_content,
            ${posts.createdAt} as post_created_at,
            ${posts.ownerId} as post_owner_id,
            ${posts.communityId} as post_community_id,
            ${posts.deleted} as post_deleted,
            ${posts.disabled} as post_disabled
            from ${posts} 
            where ${posts.communityId} = ${communityId}
            and ${posts.disabled} = false
            and ${posts.deleted} = false
            order by ${posts.createdAt} desc
            limit ${numPosts} offset ${_page * numPosts}
          ), post_owners as (
            select
              ${users.id} as user_id,
              ${users.name} as user_name,
              ${users.avatarUrl} as user_avatar_url
            from ${users}
            inner join top_posts on ${users.id} = top_posts.post_owner_id
          ), post_reactions_positive as (
            select
              count(${postReactions.postId}) as positive_reactions,
              ${postReactions.postId} as post_id
            from ${postReactions}
            inner join top_posts on ${postReactions.postId} = top_posts.post_id
            where ${postReactions.reaction} = true
            group by ${postReactions.postId}
          ), post_reactions_negative as (
            select
              count(${postReactions.postId}) as negative_reactions,
              ${postReactions.postId} as post_id
            from ${postReactions}
            inner join top_posts on ${postReactions.postId} = top_posts.post_id
            where ${postReactions.reaction} = false
            group by ${postReactions.postId}
          ), user_reaction as (
            select
              ${postReactions.postId} as post_id,
              ${postReactions.reaction} as reaction
            from ${postReactions}
            inner join top_posts on ${postReactions.postId} = top_posts.post_id
            where ${postReactions.ownerId} = ${userId}
          ), post_comments as (
            select
              ${postComments.id} as comment_id,
              ${postComments.content} as comment_content,
              ${postComments.createdAt} as comment_created_at,
              ${postComments.ownerId} as _comment_owner_id,
              ${postComments.postId} as comment_post_id,
              ROW_NUMBER() OVER (PARTITION BY ${postComments.postId} ORDER BY ${
        postComments.createdAt
      } DESC) as comment_post_index
            from ${postComments}
            inner join top_posts on ${postComments.postId} = top_posts.post_id
            order by ${postComments.createdAt} desc
          ), comment_owners as (
            select
              ${users.id} as comment_owner_id,
              ${users.name} as comment_owner_name,
              ${users.avatarUrl} as comment_owner_avatar_url
            from ${users}
            inner join post_comments on ${users.id} = post_comments._comment_owner_id
          ), total_comments as (
            select 
              count(${postComments.id}) as total_comments,
              ${postComments.postId} as post_id
            from ${postComments}
            inner join top_posts on ${postComments.postId} = top_posts.post_id
            group by ${postComments.postId}
          )

          select
            top_posts.*,
            post_owners.*,
            post_reactions_positive.positive_reactions,
            post_reactions_negative.negative_reactions,
            user_reaction.reaction as user_reaction,
            post_comments.*,
            comment_owners.*,
            total_comments.total_comments
          from top_posts
          left join post_owners on top_posts.post_owner_id = post_owners.user_id
          left join post_reactions_positive on top_posts.post_id = post_reactions_positive.post_id
          left join post_reactions_negative on top_posts.post_id = post_reactions_negative.post_id
          left join user_reaction on top_posts.post_id = user_reaction.post_id
          left join post_comments on top_posts.post_id = post_comments.comment_post_id
          left join comment_owners on post_comments._comment_owner_id = comment_owners.comment_owner_id
          left join total_comments on top_posts.post_id = total_comments.post_id
          where post_comments.comment_post_index < ${numPostComments + 1}
          order by top_posts.post_created_at desc
      `
      const data = (await db.execute(query)) as {
        post_id: string
        post_title: string
        post_content: string
        post_created_at: string
        post_owner_id: string
        post_community_id: string
        post_deleted: boolean
        post_disabled: boolean
        user_id: string
        user_name: string
        user_avatar_url: string
        positive_reactions: number
        negative_reactions: number
        user_reaction: boolean | null
        comment_id: string
        comment_content: string
        comment_created_at: string
        comment_owner_id: string
        comment_post_id: string
        comment_owner_name: string
        comment_owner_avatar_url: string
        total_comments: number
      }[]

      return data.reduce((acc, item) => {
        let post = acc.find((p) => p.id === item.post_id)
        if (!post) {
          const user = data.find((u) => u.user_id === item.post_owner_id)
          post = {
            id: item.post_id,
            title: item.post_title,
            content: item.post_content,
            createdAt: new Date(item.post_created_at),
            ownerId: item.post_owner_id,
            communityId: item.post_community_id,
            deleted: item.post_deleted,
            disabled: item.post_disabled,
            user: {
              id: user?.user_id ?? "",
              name: user?.user_name ?? "",
              avatarUrl: user?.user_avatar_url ?? "",
            },
            reactions: {
              positive: item.positive_reactions,
              negative: item.negative_reactions,
            },
            comments: item.comment_id
              ? [
                  {
                    id: item.comment_id,
                    content: item.comment_content,
                    createdAt: new Date(item.comment_created_at),
                    user: {
                      id: item.comment_owner_id,
                      name: item.comment_owner_name,
                      avatarUrl: item.comment_owner_avatar_url,
                    },
                  },
                ]
              : [],
            userReaction: item.user_reaction,
            totalComments: item.total_comments.toString(),
          } as CommunityPostData
          acc.push(post)
          return acc
        }

        if (item.comment_id && !post.comments.find((c) => c.id === item.comment_id)) {
          const commentOwner = data.find((u) => u.comment_owner_id === item.comment_owner_id)
          post.comments.push({
            id: item.comment_id,
            content: item.comment_content,
            createdAt: new Date(item.comment_created_at),
            user: {
              id: commentOwner?.comment_owner_id ?? "",
              name: commentOwner?.comment_owner_name ?? "",
              avatarUrl: commentOwner?.comment_owner_avatar_url ?? "",
            },
          })
        }

        return acc
      }, [] as CommunityPostData[])
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getOwnedCommunitiesByUser(userId: string): Promise<CommunityListData[]> {
    try {
      return await db
        .select({
          community: communities,
          members: sql<number>`count(${communityMembers.id})`,
        })
        .from(communities)
        .where(eq(communities.disabled, false))
        .innerJoin(
          communityMembers,
          and(
            eq(communityMembers.communityId, communities.id),
            eq(communityMembers.memberType, "owner")
          )
        )
        .where(eq(communityMembers.userId, userId))
        .groupBy(communities.id)
        .orderBy(({ members }) => desc(members))
        .execute()
    } catch (error) {
      console.error(error)
      return []
    }
  },
  async getModeratedCommunitiesByUser(userId: string): Promise<CommunityListData[]> {
    try {
      return await db
        .select({
          community: communities,
          members: sql<number>`count(${communityMembers.id})`,
        })
        .from(communities)
        .where(and(eq(communities.disabled, false), eq(communities.deleted, false)))
        .innerJoin(
          communityMembers,
          and(
            eq(communityMembers.communityId, communities.id),
            eq(communityMembers.memberType, "moderator")
          )
        )
        .where(eq(communityMembers.userId, userId))
        .groupBy(communities.id)
        .orderBy(({ members }) => desc(members))
        .execute()
    } catch (error) {
      console.error(error)
      return []
    }
  },
  async getMemberCommunitiesByUser(userId: string): Promise<CommunityListData[]> {
    try {
      return await db
        .select({
          community: communities,
          members: sql<number>`count(${communityMembers.id})`,
        })
        .from(communities)
        .where(and(eq(communities.disabled, false), eq(communities.deleted, false)))
        .innerJoin(
          communityMembers,
          and(
            eq(communityMembers.communityId, communities.id),
            eq(communityMembers.memberType, "member")
          )
        )
        .where(eq(communityMembers.userId, userId))
        .groupBy(communities.id)
        .orderBy(({ members }) => desc(members))
        .execute()
    } catch (error) {
      console.error(error)
      return []
    }
  },

  async joinCommunity(communityId: string, userId: string): Promise<JoinResult | void> {
    try {
      await db
        .insert(communityMembers)
        .values({
          communityId,
          userId,
          memberType: "member",
        })
        .execute()

      return { type: JoinResultType.Success }
    } catch (error) {
      console.error(error)
      return
    }
  },

  async leaveCommunity(communityId: string, userId: string): Promise<LeaveResult | void> {
    try {
      const res = await db
        .delete(communityMembers)
        .where(
          and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))
        )
        .returning()
        .execute()

      return { type: res.length > 0 ? LeaveResultType.Success : LeaveResultType.NotAMember }
    } catch (error) {
      console.error(error)
      return
    }
  },

  async submitJoinRequest(communityId: string, userId: string): Promise<JoinResult | void> {
    try {
      await db
        .insert(communityJoinRequests)
        .values({ communityId, userId })
        .onConflictDoUpdate({
          target: [communityJoinRequests.communityId, communityJoinRequests.userId],
          set: { createdAt: sql`now_utc()`, response: null },
        })
        .execute()

      return { type: JoinResultType.Pending }
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getJoinRequests(communityId: string): Promise<CommunityJoinRequestData[] | void> {
    try {
      return await db.query.communityJoinRequests
        .findMany({
          where: (joinReq, { and, eq }) =>
            and(eq(joinReq.communityId, communityId), isNull(joinReq.response)),
          columns: {
            id: true,
            createdAt: true,
            communityId: true,
          },
          with: {
            user: true,
          },
        })
        .execute()
    } catch (error) {
      console.error(error)
      return
    }
  },

  async respondToJoinRequest(
    requestId: string,
    response: boolean
  ): Promise<CommunityJoinRequest | ApiError | void> {
    try {
      const res = await db
        .update(communityJoinRequests)
        .set({ response })
        .where(eq(communityJoinRequests.id, requestId))
        .returning()
        .execute()

      if (res.length === 0) return new NotFoundError()
      if (!response) return

      const { communityId, userId } = res[0]
      await db
        .insert(communityMembers)
        .values({
          communityId,
          userId,
          memberType: "member",
        })
        .execute()
      return res[0]
    } catch (error) {
      console.error(error)
    }
  },

  async updateCommunityMemberType(
    communityId: string,
    userId: string,
    memberType: "member" | "moderator" | "owner"
  ): Promise<CommunityMember | undefined> {
    try {
      return (
        await db
          .update(communityMembers)
          .set({ memberType })
          .where(
            and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))
          )
          .returning()
          .execute()
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getCommunityMember(communityId: string, userId: string): Promise<CommunityMember | void> {
    try {
      return await db.query.communityMembers.findFirst({
        where: (member, { and, eq }) =>
          and(
            eq(member.communityId, communityId),
            eq(member.userId, userId),
            eq(member.disabled, false)
          ),
      })
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getCommunityMemberData(
    communityId: string,
    userId: string
  ): Promise<CommunityMemberData | void> {
    try {
      return await db.query.communityMembers.findFirst({
        where: (member, { and, eq }) =>
          and(
            eq(member.communityId, communityId),
            eq(member.userId, userId),
            eq(member.disabled, false)
          ),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
      })
    } catch (error) {
      console.error(error)
      return
    }
  },

  async checkCommunityMemberValidity(communityId: string, userId: string): Promise<Error | void> {
    const member = await communityService.getCommunityMember(communityId, userId)
    if (!member) return new UnauthorizedError()
    if (member.disabled) return new ForbiddenError()
  },

  async getPage(page = 0): Promise<CommunityListData[] | void> {
    const _page = page < 0 ? 0 : page
    try {
      return await db
        .select({
          members: sql<number>`count(${communityMembers.id})`,
          community: communities,
        })
        .from(communities)
        .where(and(eq(communities.disabled, false), eq(communities.deleted, false)))
        .limit(this.pageSize)
        .offset(_page * this.pageSize)
        .leftJoin(communityMembers, eq(communityMembers.communityId, communities.id))
        .groupBy(communities.id)
        .orderBy(({ members }) => desc(members))
        .execute()
    } catch (error) {
      console.error(error)
      return
    }
  },

  async createCommunity(
    community: Omit<NewCommunity, "url_title">,
    userId: string
  ): Promise<{ id: string } | ApiError | undefined> {
    try {
      const newCommunity = (
        await db.insert(communities).values(community).onConflictDoNothing().returning()
      ).at(0)
      if (!newCommunity) return new ServerError("Failed to create community - name must be unique")

      const ownerMember = (
        await db
          .insert(communityMembers)
          .values({
            communityId: newCommunity.id,
            userId: userId,
            memberType: "owner",
          })
          .returning()
      ).at(0)

      if (!ownerMember) return new ServerError("Failed to create community owner")

      return {
        id: newCommunity.url_title!,
      }
    } catch (error) {
      console.error(error)
      return
    }
  },

  async updateCommunity(community: Partial<NewCommunity>, communityId: string) {
    try {
      const updatedCommunity = (
        await db
          .update(communities)
          .set(community)
          .where(and(eq(communities.id, communityId)))
          .returning()
      ).at(0)

      if (!updatedCommunity) return new ServerError("Failed to update community")
      return updatedCommunity
    } catch (error) {
      console.error(error)
      return
    }
  },

  async deleteCommunity(communityId: string) {
    try {
      const res = await db
        .update(communities)
        .set({ deleted: true })
        .where(eq(communities.id, communityId))
        .returning()
        .execute()

      if (res.length === 0) return new ServerError()
      return true
    } catch (error) {
      console.error(error)
      return
    }
  },
}
