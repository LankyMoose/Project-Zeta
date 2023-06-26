import { and, eq, sql } from "drizzle-orm"
import { db } from "../../db"

import { NewCommunity, categoryCommunities, communities, communityMembers } from "../../db/schema"
import { ApiError, ForbiddenError, ServerError, UnauthorizedError } from "../../errors"
import { CommunityListData, JoinResult, JoinResultType } from "../../types/community"

export const communityService = {
  pageSize: 10,

  async getCommunity(titleOrId: string, useId: boolean = false) {
    try {
      return await db.query.communities.findFirst({
        where: (community, { eq, and }) =>
          and(
            eq(useId ? community.id : community.url_title, titleOrId),
            eq(community.disabled, false)
          ),
        with: {
          categories: { with: { category: true } },
          posts: {
            limit: 10,
            orderBy: (posts, { desc }) => [desc(posts.createdAt)],
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
                limit: 3,
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
          members: {
            limit: 10,
            where: (members, { eq }) => eq(members.memberType, "member"),
            with: {
              user: true,
            },
          },
          moderators: {
            limit: 3,
            where: (members, { eq }) => eq(members.memberType, "moderator"),
            with: {
              user: true,
            },
          },
          owners: {
            limit: 1,
            where: (members, { eq }) => eq(members.memberType, "owner"),
            with: {
              user: true,
            },
          },
        },
      })
    } catch (error) {
      console.error(error)
      return
    }
  },

  async joinCommunity(communityId: string, userId: string): Promise<JoinResult | ApiError | void> {
    try {
      await db
        .insert(communityMembers)
        .values({
          communityId,
          userId,
          memberType: "member",
        })
        .execute()

      return {
        type: JoinResultType.Success,
      }
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getCommunityMember(communityId: string, userId: string) {
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
        .where(eq(communities.disabled, false))
        .limit(this.pageSize)
        .offset(_page * this.pageSize)
        .leftJoin(communityMembers, eq(communityMembers.communityId, communities.id))
        .groupBy(communities.id)
        .execute()
    } catch (error) {
      console.error(error)
      return
    }
  },

  async createCommunity(
    community: Omit<NewCommunity, "url_title">,
    userId: string,
    categoryIds?: string[]
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

      if (categoryIds && categoryIds.length > 0) {
        await Promise.all(
          categoryIds.map(async (categoryId) => {
            await db.insert(categoryCommunities).values({
              communityId: newCommunity.id,
              categoryId,
            })
          })
        )
      }

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
}
