import { db } from "../../db"

import {
  NewCommunity,
  categoryCommunities,
  communities,
  communityMembers,
} from "../../db/schema"

export const communityService = {
  pageSize: 10,

  async getCommunity(id: string) {
    return await db.query.communities.findFirst({
      where: (community, { eq }) => eq(community.id, id),
      with: {
        posts: {
          limit: 10,
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
  },

  async getPage(page = 0) {
    const _page = page < 0 ? 0 : page
    return await db.query.communities.findMany({
      limit: this.pageSize,
      offset: _page * this.pageSize,
    })
  },

  async createCommunity(
    community: NewCommunity,
    userId: string,
    categoryIds?: string[]
  ): Promise<{ id: string } | void> {
    try {
      const newCommunity = (
        await db.insert(communities).values(community).returning()
      ).at(0)
      console.log("new community", newCommunity)
      if (!newCommunity) throw new Error("failed to create community")

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
        id: newCommunity.id,
      }
    } catch (error) {
      console.error(error)
    }
  },
}
