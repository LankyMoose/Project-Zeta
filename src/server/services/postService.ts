import { eq } from "drizzle-orm"
import { db } from "../../db"
import { Post, posts, postReactions, PostReaction, NewPost, postComments } from "../../db/schema"
import { CommunityPostComment } from "../../types/post"
import { ServerError } from "../../errors"
import { PublicUser } from "../../types/user"

export const postService = {
  pageSize: 25,
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
    user: PublicUser,
    comment: string
  ): Promise<CommunityPostComment | undefined> {
    try {
      const newComment = (
        await db
          .insert(postComments)
          .values({
            postId,
            ownerId: user.userId,
            content: comment,
          })
          .returning()
      ).at(0)
      if (!newComment) {
        throw new ServerError("Comment not created")
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

  async createPost(post: NewPost): Promise<Post | undefined> {
    try {
      return (await db.insert(posts).values(post).returning()).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },
}
