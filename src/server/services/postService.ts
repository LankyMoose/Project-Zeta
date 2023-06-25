import { eq } from "drizzle-orm"
import { db } from "../../db"
import {
  Post,
  posts,
  postReactions,
  PostReaction,
  NewPost,
  postComments,
  users,
} from "../../db/schema"
import { CommunityPostComment } from "../../types/post"
import { ServerError } from "../../errors"

export const postService = {
  async getPost(postId: string): Promise<Post | undefined> {
    try {
      return (await db.select().from(posts).where(eq(posts.id, postId))).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async addPostComment(
    postId: string,
    userId: string,
    comment: string
  ): Promise<CommunityPostComment | undefined> {
    try {
      const newComment = (
        await db
          .insert(postComments)
          .values({
            postId,
            ownerId: userId,
            content: comment,
          })
          .returning()
      ).at(0)
      if (!newComment) {
        throw new ServerError("Comment not created")
      }
      const user = (await db.select().from(users).where(eq(users.id, userId))).at(0)
      if (!user) {
        throw new ServerError("User not found")
      }
      return {
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.createdAt,
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      }
    } catch (error) {
      console.error(error)
      return
    }
  },

  async addPostReaction(
    postId: string,
    userId: string,
    reaction: boolean
  ): Promise<PostReaction | undefined> {
    try {
      return (
        await db
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
          .returning()
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getPosts(communityId: string, offset: number = 0): Promise<Post[] | undefined> {
    try {
      return await db
        .select()
        .from(posts)
        .where(eq(posts.communityId, communityId))
        .offset(offset)
        .limit(10)
        .orderBy(posts.createdAt)
    } catch (error) {
      console.error(error)
      return
    }
  },
  async createPost(post: NewPost): Promise<Post | undefined> {
    try {
      return (await db.insert(posts).values(post).returning()).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },
}
