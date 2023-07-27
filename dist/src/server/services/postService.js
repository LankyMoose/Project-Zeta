import { eq } from "drizzle-orm";
import { db } from "../../db";
import { posts, postReactions, postComments } from "../../db/schema";
import { ServerError } from "../../errors";
export const postService = {
    async getPost(postId) {
        try {
            return (await db.select().from(posts).where(eq(posts.id, postId))).at(0);
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async addPostComment(postId, user, comment) {
        try {
            const newComment = (await db
                .insert(postComments)
                .values({
                postId,
                ownerId: user.userId,
                content: comment,
            })
                .returning()).at(0);
            if (!newComment) {
                throw new ServerError("Comment not created");
            }
            return {
                id: newComment.id,
                content: newComment.content,
                createdAt: newComment.createdAt,
                user: {
                    id: user.userId,
                    name: user.name,
                    avatarUrl: user.picture,
                },
            };
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async addPostReaction(postId, userId, reaction) {
        try {
            return (await db
                .insert(postReactions)
                .values({
                postId,
                ownerId: userId,
                reaction,
            })
                .onConflictDoUpdate({
                target: [postReactions.postId, postReactions.ownerId],
                set: {
                    reaction,
                },
            })
                .returning()).at(0);
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async getPosts(communityId, offset = 0) {
        try {
            return await db
                .select()
                .from(posts)
                .where(eq(posts.communityId, communityId))
                .offset(offset)
                .limit(10)
                .orderBy(posts.createdAt);
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async createPost(post) {
        try {
            return (await db.insert(posts).values(post).returning()).at(0);
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
};
