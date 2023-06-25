import { db } from "../../db"

import { NewCommunity, categoryCommunities, communities, communityMembers } from "../../db/schema"
import { ApiError, ForbiddenError, ServerError, UnauthorizedError } from "../../errors"

export const communityService = {
  pageSize: 10,

  async getCommunity(titleOrId: string, useId: boolean = false) {
    try {
      return await db.query.communities.findFirst({
        where: (community, { eq, and }) =>
          and(eq(useId ? community.id : community.url_title, titleOrId), eq(community.disabled, false)),
        with: {
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
          owner: {
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

  async getCommunityMember(communityId: string, userId: string) {
    try {
      return await db.query.communityMembers.findFirst({
        where: (member, { and, eq }) =>
          and(eq(member.communityId, communityId), eq(member.userId, userId), eq(member.disabled, false)),
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

  async getPage(page = 0) {
    const _page = page < 0 ? 0 : page
    try {
      return await db.query.communities.findMany({
        limit: this.pageSize,
        offset: _page * this.pageSize,
        where: (community, { eq }) => eq(community.disabled, false),
      })
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
      const newCommunity = (await db.insert(communities).values(community).onConflictDoNothing().returning()).at(0)
      if (!newCommunity) return new ServerError("Failed to create community - name must be unique")

      await db
        .insert(communityMembers)
        .values({
          communityId: newCommunity.id,
          userId,
          memberType: "owner",
        })
        .execute()

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
}
