import { and, desc, eq, gte, isNull, sql } from "drizzle-orm"
import { db } from "../../db"

import {
  CommunityMember,
  NewCommunity,
  communities,
  communityJoinRequests,
  communityMembers,
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
  CommunitySearchData,
  JoinResult,
  JoinResultType,
  LeaveResult,
  LeaveResultType,
} from "../../types/community"
import { CommunityPostListData } from "../../types/post"

export const communityService = {
  pageSize: 25,
  fuzzySearchCache: [] as CommunitySearchData[],
  maxFuzzySearchCacheSize: 100,

  async getLatestPostsFromPublicCommunities(page = 0): Promise<CommunityPostListData[] | void> {
    try {
      return await db
        .select({
          post: posts,
          community: {
            id: communities.id,
            title: communities.title,
            url_title: communities.url_title,
          },
          user: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(posts)
        .where(and(eq(posts.disabled, false), eq(posts.deleted, false)))
        .limit(this.pageSize)
        .offset(page * this.pageSize)
        .innerJoin(users, eq(users.id, posts.ownerId))
        .innerJoin(
          communities,
          and(
            eq(communities.id, posts.communityId),
            eq(communities.private, false),
            eq(communities.disabled, false),
            eq(communities.deleted, false)
          )
        )
        .orderBy(({ post }) => desc(post.createdAt))
        .execute()
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getLatestPostsFromUserCommunities(
    userId: string,
    page = 0
  ): Promise<CommunityPostListData[] | void> {
    try {
      return await db
        .select({
          post: posts,
          community: {
            id: communities.id,
            title: communities.title,
            url_title: communities.url_title,
          },
          user: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(posts)
        .where(and(eq(posts.disabled, false), eq(posts.deleted, false)))
        .limit(this.pageSize)
        .offset(page * this.pageSize)
        .innerJoin(users, eq(users.id, posts.ownerId))
        .innerJoin(
          communityMembers,
          and(
            eq(communityMembers.communityId, posts.communityId),
            and(eq(communityMembers.userId, userId), eq(communityMembers.disabled, false))
          )
        )
        .innerJoin(
          communities,
          and(
            eq(communities.id, posts.communityId),
            eq(communities.disabled, false),
            eq(communities.deleted, false)
          )
        )
        .orderBy(({ post }) => desc(post.createdAt))
        .execute()
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
        with: {
          posts: {
            limit: 10,
            orderBy: (posts, { desc }) => desc(posts.createdAt),
            where: (post, { eq }) => eq(post.disabled, false),
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
              comments: {
                orderBy: (comments, { asc }) => asc(comments.createdAt),
                columns: {
                  id: true,
                  content: true,
                  createdAt: true,
                },
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              reactions: {
                columns: {
                  reaction: true,
                  ownerId: true,
                },
              },
            },
          },
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

  async getOwnedCommunities(userId: string): Promise<CommunityListData[] | void> {
    try {
      return await db
        .select({
          community: communities,
          members: sql<number>`count(${communityMembers.id})`,
        })
        .from(communities)
        .where(eq(communities.disabled, false))
        .limit(this.pageSize)
        .offset(0)
        .innerJoin(communityMembers, eq(communityMembers.communityId, communities.id))
        .where(eq(communityMembers.userId, userId))
        .groupBy(communities.id)
        .orderBy(({ members }) => desc(members))
        .execute()
    } catch (error) {
      console.error(error)
      return
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
        .onConflictDoNothing()
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
  ): Promise<CommunityMember | ApiError | undefined> {
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

      return (
        await db
          .insert(communityMembers)
          .values({
            communityId,
            userId,
            memberType: "member",
          })
          .returning()
          .execute()
      ).at(0) as CommunityMember
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
