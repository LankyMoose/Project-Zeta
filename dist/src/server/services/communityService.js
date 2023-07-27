import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db";
import { communities, communityMembers } from "../../db/schema";
import { ForbiddenError, ServerError, UnauthorizedError } from "../../errors";
import { JoinResultType, } from "../../types/community";
export const communityService = {
    pageSize: 10,
    fuzzySearchCache: [],
    maxFuzzySearchCacheSize: 100,
    async fuzzySearchCommunity(title) {
        //https://www.freecodecamp.org/news/fuzzy-string-matching-with-postgresql/
        //https://www.postgresql.org/docs/current/pgtrgm.html
        try {
            let cached = this.fuzzySearchCache.find((item) => item.search === title);
            if (cached)
                return cached;
            const res = await db
                .select({
                title: communities.title,
                url_title: communities.url_title,
                similarity: sql `SIMILARITY(title,${`%${title}%`})`.as("similarity"),
            })
                .from(communities)
                .where(({ similarity }) => and(eq(communities.disabled, false), gte(similarity, 0.15)))
                .orderBy(({ similarity }) => desc(similarity))
                .limit(this.pageSize)
                .execute();
            if (!res)
                return;
            cached = this.fuzzySearchCache.find((item) => item.search === title);
            if (cached) {
                cached.communities = res;
                return cached;
            }
            const newCacheItem = {
                search: title,
                communities: res,
            };
            if (this.fuzzySearchCache.length >= this.maxFuzzySearchCacheSize) {
                this.fuzzySearchCache.pop();
            }
            this.fuzzySearchCache.unshift(newCacheItem);
            return newCacheItem;
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async getCommunity(titleOrId, useId = false) {
        try {
            return await db.query.communities.findFirst({
                where: (community, { eq, and }) => and(eq(useId ? community.id : community.url_title, titleOrId), eq(community.disabled, false)),
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
            });
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async joinCommunity(communityId, userId) {
        try {
            await db
                .insert(communityMembers)
                .values({
                communityId,
                userId,
                memberType: "member",
            })
                .execute();
            return {
                type: JoinResultType.Success,
            };
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async getCommunityMember(communityId, userId) {
        try {
            return await db.query.communityMembers.findFirst({
                where: (member, { and, eq }) => and(eq(member.communityId, communityId), eq(member.userId, userId), eq(member.disabled, false)),
            });
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async checkCommunityMemberValidity(communityId, userId) {
        const member = await communityService.getCommunityMember(communityId, userId);
        if (!member)
            return new UnauthorizedError();
        if (member.disabled)
            return new ForbiddenError();
    },
    async getPage(page = 0) {
        const _page = page < 0 ? 0 : page;
        try {
            return await db
                .select({
                members: sql `count(${communityMembers.id})`,
                community: communities,
            })
                .from(communities)
                .where(eq(communities.disabled, false))
                .limit(this.pageSize)
                .offset(_page * this.pageSize)
                .leftJoin(communityMembers, eq(communityMembers.communityId, communities.id))
                .groupBy(communities.id)
                .execute();
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async createCommunity(community, userId) {
        try {
            const newCommunity = (await db.insert(communities).values(community).onConflictDoNothing().returning()).at(0);
            if (!newCommunity)
                return new ServerError("Failed to create community - name must be unique");
            const ownerMember = (await db
                .insert(communityMembers)
                .values({
                communityId: newCommunity.id,
                userId: userId,
                memberType: "owner",
            })
                .returning()).at(0);
            if (!ownerMember)
                return new ServerError("Failed to create community owner");
            return {
                id: newCommunity.url_title,
            };
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async updateCommunity(community, communityId) {
        try {
            const updatedCommunity = (await db
                .update(communities)
                .set(community)
                .where(and(eq(communities.id, communityId)))
                .returning()).at(0);
            if (!updatedCommunity)
                return new ServerError("Failed to update community");
            return updatedCommunity;
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
};
