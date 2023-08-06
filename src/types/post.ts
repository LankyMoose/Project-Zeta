import { Post, NewPost } from "../db/schema/"
import { NewPoll, Poll, PollOption } from "../db/schema/polls"

export type NewPollDTO = Omit<NewPoll, "postId"> & { options: string[] }

export type NewPostDTO = Omit<NewPost, "ownerId"> & {
  numMedia?: number
  poll?: NewPollDTO
}

export type NewPostResponse = {
  post: Post
  urls: string[]
  poll?: Poll
}

export type PostReaction = {
  reaction: boolean
  ownerId: string
}
export type PostCommentWithUser = {
  id: string
  content: string
  createdAt: string | Date
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}
export type PostCommentReplyWithUser = {
  commentId: string
  id: string
  content: string
  createdAt: string | Date
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export type FlatPostComment = {
  comment_id: string
  comment_content: string
  comment_created_at: string
  user_id: string
  user_name: string
  user_avatar_url: string | null
}

export type FlatPostCommentReply = {
  reply_id: string
  reply_content: string
  reply_created_at: string
  user_id: string
  user_name: string
  user_avatar_url: string | null
}

export type PostWithMeta = Post & {
  user: {
    id: string
    name: string
    avatarUrl: string
  }
  reactions: {
    positive: number
    negative: number
  }
  userReaction: boolean | null
  totalComments: string
  media: { id: string; url: string }[]
  community: {
    id: string
    title: string
    url_title: string | undefined
  }
}
export type PostWithMetaWithComments = PostWithMeta & {
  comments: PostCommentWithUser[]
}

export type FlatPostWithMeta = {
  post_id: string
  post_title: string
  post_content: string
  post_created_at: string
  post_owner_id: string
  post_community_id: string
  post_deleted: boolean
  post_disabled: boolean
  user_id: string
  user_name: string
  user_avatar_url: string
  positive_reactions: number
  negative_reactions: number
  user_reaction: boolean | null
  total_comments: number
  media_id: string
  media_url: string
  community_id: string
  community_title: string
  community_url_title: string
}

export type PollWithOptions = Poll & {
  options: PollOption[]
}
