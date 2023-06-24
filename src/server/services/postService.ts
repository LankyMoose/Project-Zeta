import { eq } from "drizzle-orm"
import { db } from "../../db"
import { NewPost, Post, posts } from "../../db/schema"
import { communityService } from "./communityService"

export const postService = {
  async getPosts(communityId: string): Promise<Post[]> {
    try {
      return await db
        .select()
        .from(posts)
        .where(eq(posts.communityId, communityId))
        .orderBy(posts.createdAt)
    } catch (error) {
      console.error(error)
      return []
    }
  },
  async createPost(post: NewPost): Promise<Post | undefined> {
    try {
      const member = await communityService.getCommunityMember(
        post.communityId,
        post.ownerId
      )
      if (!member) throw new Error("Invalid user or community")
      return (await db.insert(posts).values(post).returning()).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },
}
