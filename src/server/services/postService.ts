import { eq } from "drizzle-orm"
import { db } from "../../db"
import { NewPost, Post, posts } from "../../db/schema"
import { communityService } from "./communityService"

export const postService = {
  async getPosts(communityId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.communityId, communityId))
      .orderBy(posts.createdAt)
  },
  async createPost(post: NewPost): Promise<Post | undefined> {
    const member = await communityService.getCommunityMember(
      post.communityId,
      post.ownerId
    )
    if (!member) throw new Error("Invalid user or community")
    return (await db.insert(posts).values(post).returning()).at(0)
  },
}
