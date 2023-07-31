import { and, desc, eq, gte, isNull, sql } from "drizzle-orm"
import { db } from "../../db"

import {
  Community,
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
import { ApiError, NotFoundError, ServerError } from "../../errors"
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

type FlatCommunityPostData = {
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
  total_comments: number
}

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

  async getCommunity(titleOrId: string, useId: boolean = false): Promise<Community | void> {
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

  async getCommunityPosts(
    communityId: string,
    userId?: string,
    page = 0
  ): Promise<CommunityPostData[] | void> {
    const numPosts = 10
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
            limit ${numPosts} offset ${page * numPosts}
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
            where ${userId ? `${postReactions.ownerId} = ${userId}` : `1 = 0`}
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
            total_comments.total_comments
          from top_posts
          left join post_owners on top_posts.post_owner_id = post_owners.user_id
          left join post_reactions_positive on top_posts.post_id = post_reactions_positive.post_id
          left join post_reactions_negative on top_posts.post_id = post_reactions_negative.post_id
          left join user_reaction on top_posts.post_id = user_reaction.post_id
          left join total_comments on top_posts.post_id = total_comments.post_id
          order by top_posts.post_created_at desc
      `
      const data = (await db.execute(query)) as FlatCommunityPostData[]

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
            userReaction: item.user_reaction,
            totalComments: item.total_comments?.toString(),
          } as CommunityPostData
          acc.push(post)
          return acc
        }
        return acc
      }, [] as CommunityPostData[])
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getCommunityPost(postId: string, userId?: string): Promise<CommunityPostData | void> {
    try {
      const query = sql`
        with post as (
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
          where ${posts.id} = ${postId}
        ), post_owner as (
          select
            ${users.id} as user_id,
            ${users.name} as user_name,
            ${users.avatarUrl} as user_avatar_url
          from ${users}
          inner join post on ${users.id} = post_owner_id
        ), post_reactions_positive as (
          select
            count(${postReactions.postId}) as positive_reactions,
            ${postReactions.postId} as post_id  
          from ${postReactions}
          inner join post on ${postReactions.postId} = post.post_id
          where ${postReactions.reaction} = true
          group by ${postReactions.postId}
        ), post_reactions_negative as (
          select
            count(${postReactions.postId}) as negative_reactions,
            ${postReactions.postId} as post_id
          from ${postReactions}
          inner join post on ${postReactions.postId} = post.post_id
          where ${postReactions.reaction} = false
          group by ${postReactions.postId}
        ), user_reaction as (
          select
            ${postReactions.postId} as post_id,
            ${postReactions.reaction} as reaction
          from ${postReactions}
          inner join post on ${postReactions.postId} = post.post_id
          where ${userId ? `${postReactions.ownerId} = ${userId}` : `1 = 0`}
        ), total_comments as (
          select
            count(${postComments.id}) as total_comments,
            ${postComments.postId} as post_id
          from ${postComments}
          inner join post on ${postComments.postId} = post.post_id
          group by ${postComments.postId}
        )

        select
          post.*,
          post_owner.*,
          post_reactions_positive.positive_reactions,
          post_reactions_negative.negative_reactions,
          user_reaction.reaction as user_reaction,
          total_comments.total_comments
        from post
        left join post_owner on post.post_owner_id = post_owner.user_id
        left join post_reactions_positive on post.post_id = post_reactions_positive.post_id
        left join post_reactions_negative on post.post_id = post_reactions_negative.post_id
        left join user_reaction on post.post_id = user_reaction.post_id
        left join total_comments on post.post_id = total_comments.post_id
      `
      const data = (await db.execute(query)) as FlatCommunityPostData[]
      if (data.length === 0) return

      const item = data[0]
      return {
        id: item.post_id,
        title: item.post_title,
        content: item.post_content,
        createdAt: new Date(item.post_created_at),
        ownerId: item.post_owner_id,
        communityId: item.post_community_id,
        deleted: item.post_deleted,
        disabled: item.post_disabled,
        user: {
          id: item.user_id,
          name: item.user_name,
          avatarUrl: item.user_avatar_url,
        },
        reactions: {
          positive: item.positive_reactions,
          negative: item.negative_reactions,
        },
        userReaction: item.user_reaction,
        totalComments: item.total_comments?.toString(),
      } as CommunityPostData
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

  async getCommunityMember(
    communityId: string,
    userId: string
  ): Promise<
    | (CommunityMember & {
        community: {
          disabled: boolean | null
          deleted: boolean | null
        }
      })
    | void
  > {
    try {
      return await db.query.communityMembers.findFirst({
        where: (member, { and, eq }) =>
          and(eq(member.communityId, communityId), eq(member.userId, userId)),
        with: {
          community: {
            columns: {
              disabled: true,
              deleted: true,
            },
          },
        },
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
