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
  PostComment,
  postCommentReactions,
  PostCommentReaction,
  postCommentReplies,
  postMultimedia,
} from "../../db/schema"
import {
  PostCommentWithUser,
  PostWithMeta,
  FlatPostComment,
  FlatPostWithMeta,
  NewPollDTO,
  PollWithOptions,
  FlatPostCommentReply,
  PostCommentReplyWithUser,
} from "../../types/post"
import { ServerError } from "../../errors"
import { PublicUser } from "../../types/user"
import { POST_COMMENT_PAGE_SIZE } from "../../constants"
import { s3Service } from "./s3Service"
import { pollOptions, polls } from "../../db/schema/polls"

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

  async getPostWithMetadata(postId: string, userId?: string): Promise<PostWithMeta | void> {
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
          right join post on ${postReactions.postId} = post.post_id
          and ${postReactions.ownerId} = ${userId ?? null}
        ), total_comments as (
          select
            count(${postComments.id}) as total_comments,
            ${postComments.postId} as post_id
          from ${postComments}
          inner join post on ${postComments.postId} = post.post_id
          group by ${postComments.postId}
        ), post_media as (
          select 
            ${postMultimedia.id} as media_id,
            ${postMultimedia.url} as media_url,
            ${postMultimedia.postId} as post_id
          from ${postMultimedia}
          inner join post on ${postMultimedia.postId} = post.post_id
          order by ${postMultimedia.createdAt} asc
        )       

        select
          post.*,
          post_owner.*,
          post_reactions_positive.positive_reactions,
          post_reactions_negative.negative_reactions,
          user_reaction.reaction as user_reaction,
          total_comments.total_comments,
          post_media.media_id,
          post_media.media_url
        from post
        left join post_owner on post.post_owner_id = post_owner.user_id
        left join post_reactions_positive on post.post_id = post_reactions_positive.post_id
        left join post_reactions_negative on post.post_id = post_reactions_negative.post_id
        left join user_reaction on post.post_id = user_reaction.post_id
        left join total_comments on post.post_id = total_comments.post_id
        left join post_media on post.post_id = post_media.post_id
      `
      const data = (await db.execute(query)) as FlatPostWithMeta[]
      if (data.length === 0) return

      const item = data[0]
      //@ts-ignore
      const res = {
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
      } as PostWithMeta

      res.media = data
        .filter((item) => item.media_id)
        .map((item) => ({
          id: item.media_id,
          url: item.media_url,
        }))

      return res
    } catch (error) {
      console.error(error)
      return
    }
  },

  async addPostComment(
    postId: string,
    user: PublicUser,
    comment: string
  ): Promise<PostCommentWithUser | undefined> {
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

  async updatePostComment(
    commentId: string,
    comment: Partial<PostComment>
  ): Promise<PostComment | undefined> {
    try {
      return (
        await db.update(postComments).set(comment).where(eq(postComments.id, commentId)).returning()
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async addPostCommentReaction(
    commentId: string,
    userId: string,
    reaction: boolean
  ): Promise<PostCommentReaction | undefined> {
    try {
      return (
        await db
          .insert(postCommentReactions)
          .values({
            commentId,
            ownerId: userId,
            reaction,
          })
          .onConflictDoUpdate({
            target: [postCommentReactions.commentId, postCommentReactions.ownerId],
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

  async addPostCommentReply(
    commentId: string,
    user: PublicUser,
    reply: string
  ): Promise<PostCommentWithUser | undefined> {
    try {
      const createdAt = new Date().toISOString()
      const newReply = (
        await db
          .insert(postCommentReplies)
          .values({
            commentId,
            ownerId: user.userId,
            content: reply,
          })
          .returning()
      ).at(0)
      if (!newReply) {
        throw new ServerError("Reply not created")
      }
      return {
        id: newReply.id,
        content: newReply.content,
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

  async getPostCommentReplies(
    commentId: string,
    offset: number
  ): Promise<PostCommentReplyWithUser[] | void> {
    try {
      const query = sql`
        select
          ${postCommentReplies.id} as reply_id,
          ${postCommentReplies.content} as reply_content,
          ${postCommentReplies.createdAt} as reply_created_at,
          ${users.id} as user_id,
          ${users.name} as user_name,
          ${users.avatarUrl} as user_avatar_url
        from ${postCommentReplies}
        inner join ${users} on ${users.id} = ${postCommentReplies.ownerId}
        where ${postCommentReplies.commentId} = ${commentId}
        and ${postCommentReplies.deleted} = false
        order by ${postCommentReplies.createdAt} desc
        limit ${POST_COMMENT_PAGE_SIZE}
        offset ${offset}
      `
      const data = (await db.execute(query)) as FlatPostCommentReply[]
      return data.map((item) => ({
        commentId,
        id: item.reply_id,
        content: item.reply_content,
        createdAt: item.reply_created_at,
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

  async getPostComments(postId: string, offset: number): Promise<PostCommentWithUser[] | void> {
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

      const data = (await db.execute(query)) as FlatPostComment[]

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

  async updatePost(postId: string, post: Partial<Post>): Promise<Post | undefined> {
    try {
      return (await db.update(posts).set(post).where(eq(posts.id, postId)).returning()).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async updatePostMedia(postId: string, urls: string[]) {
    try {
      await db.delete(postMultimedia).where(eq(postMultimedia.postId, postId))

      return await db
        .insert(postMultimedia)
        .values(urls.map((url) => ({ postId, url })))
        .onConflictDoNothing()
        .returning({
          url: postMultimedia.url,
        })
    } catch (error) {
      console.error(error)
      return
    }
  },

  async deletePost(postId: string): Promise<Post | undefined> {
    try {
      return (
        await db
          .update(posts)
          .set({
            deleted: true,
          })
          .where(eq(posts.id, postId))
          .returning()
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async disablePost(postId: string): Promise<Post | undefined> {
    try {
      return (
        await db
          .update(posts)
          .set({
            disabled: true,
          })
          .where(eq(posts.id, postId))
          .returning()
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getPostMediaUploadUrl(postId: string, idx: number): Promise<string | void> {
    try {
      return await s3Service.getPresignedPutUrl(`post/${postId}/${idx}`)
    } catch (error) {
      console.error(error)
    }
  },

  async deletePostMedia(postId: string): Promise<boolean> {
    return s3Service.deleteObject(`post/${postId}`)
  },

  async createPostPoll(postId: string, poll: NewPollDTO): Promise<PollWithOptions | undefined> {
    try {
      const newPoll = (
        await db
          .insert(polls)
          .values({
            ...poll,
            postId,
          })
          .returning()
      ).at(0)

      if (!newPoll) throw new ServerError("Poll not created")

      const options = await db
        .insert(pollOptions)
        .values(
          poll.options.map((option) => ({
            desc: option,
            pollId: newPoll.id,
          }))
        )
        .execute()

      return {
        ...newPoll,
        options,
      }
    } catch (error) {
      console.error(error)
      return
    }
  },
}
