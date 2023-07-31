import { eq, sql } from "drizzle-orm"
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
import {
  CommunityPostComment,
  CommunityPostData,
  FlatCommunityPostComment,
  FlatCommunityPostData,
} from "../../types/post"
import { ServerError } from "../../errors"
import { PublicUser } from "../../types/user"
import { POST_COMMENT_PAGE_SIZE } from "../../constants"

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

  async getPostWithMetadata(postId: string, userId?: string): Promise<CommunityPostData | void> {
    try {
      const query = sql`
        with post as (
          select
            ${posts.id} as post_id,
            ${posts.title} as post_title, 
            ${posts.content} as post_content,
            ${posts.createdAt} as post_created_at,
            ${posts.ownerId} as post_owner_id,
            ${posts.communityId} as post_community_id,
            ${posts.deleted} as post_deleted,
            ${posts.disabled} as post_disabled
          from ${posts}
          where ${posts.id} = ${postId}
        ), post_owner as (
          select
            ${users.id} as user_id,
            ${users.name} as user_name,
            ${users.avatarUrl} as user_avatar_url
          from ${users}
          inner join post on ${users.id} = post_owner_id
        ), post_reactions_positive as (
          select
            count(${postReactions.postId}) as positive_reactions,
            ${postReactions.postId} as post_id  
          from ${postReactions}
          inner join post on ${postReactions.postId} = post.post_id
          where ${postReactions.reaction} = true
          group by ${postReactions.postId}
        ), post_reactions_negative as (
          select
            count(${postReactions.postId}) as negative_reactions,
            ${postReactions.postId} as post_id
          from ${postReactions}
          inner join post on ${postReactions.postId} = post.post_id
          where ${postReactions.reaction} = false
          group by ${postReactions.postId}
        ), user_reaction as (
          select
            ${postReactions.postId} as post_id,
            ${postReactions.reaction} as reaction
          from ${postReactions}
          inner join post on ${postReactions.postId} = post.post_id
          where ${userId ? `${postReactions.ownerId} = ${userId}` : `1 = 0`}
        ), total_comments as (
          select
            count(${postComments.id}) as total_comments,
            ${postComments.postId} as post_id
          from ${postComments}
          inner join post on ${postComments.postId} = post.post_id
          group by ${postComments.postId}
        )

        select
          post.*,
          post_owner.*,
          post_reactions_positive.positive_reactions,
          post_reactions_negative.negative_reactions,
          user_reaction.reaction as user_reaction,
          total_comments.total_comments
        from post
        left join post_owner on post.post_owner_id = post_owner.user_id
        left join post_reactions_positive on post.post_id = post_reactions_positive.post_id
        left join post_reactions_negative on post.post_id = post_reactions_negative.post_id
        left join user_reaction on post.post_id = user_reaction.post_id
        left join total_comments on post.post_id = total_comments.post_id
      `
      const data = (await db.execute(query)) as FlatCommunityPostData[]
      if (data.length === 0) return

      const item = data[0]
      //@ts-ignore
      return {
        id: item.post_id,
        title: item.post_title,
        content: item.post_content,
        createdAt: item.post_created_at,
        ownerId: item.post_owner_id,
        communityId: item.post_community_id,
        deleted: item.post_deleted,
        disabled: item.post_disabled,
        user: {
          id: item.user_id,
          name: item.user_name,
          avatarUrl: item.user_avatar_url,
        },
        reactions: {
          positive: item.positive_reactions,
          negative: item.negative_reactions,
        },
        userReaction: item.user_reaction,
        totalComments: item.total_comments?.toString(),
      } as CommunityPostData
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
      const createdAt = new Date().toISOString()
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
        createdAt,
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

  async getPostComments(postId: string, offset: number): Promise<CommunityPostComment[] | void> {
    try {
      const query = sql`
        select
          ${postComments.id} as comment_id,
          ${postComments.content} as comment_content, 
          ${postComments.createdAt} as comment_created_at,
          ${users.id} as user_id,
          ${users.name} as user_name,
          ${users.avatarUrl} as user_avatar_url
        from ${postComments}
        inner join ${users} on ${users.id} = ${postComments.ownerId}
        where ${postComments.postId} = ${postId}
        and ${postComments.deleted} = false
        order by ${postComments.createdAt} desc
        limit ${POST_COMMENT_PAGE_SIZE}
        offset ${offset}
      `

      const data = (await db.execute(query)) as FlatCommunityPostComment[]

      return data.map((item) => ({
        id: item.comment_id,
        content: item.comment_content,
        createdAt: item.comment_created_at,
        user: {
          id: item.user_id,
          name: item.user_name,
          avatarUrl: item.user_avatar_url,
        },
      }))
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
