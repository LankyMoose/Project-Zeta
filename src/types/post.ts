import { NewPost, Post } from "../db/schema/"

export enum PostAdditionalContentType {
  IMAGE = "image",
  VIDEO = "video",
  POLL = "poll",
}

export type PostReaction = {
  reaction: boolean
  ownerId: string
}
export type PostComment = {
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
}
export type PostWithMetaWithComments = PostWithMeta & {
  comments: PostComment[]
}

export type PostWithCommunityMeta = {
  post: {
    id: string
    title: string
    content: string
    createdAt: Date | string
    totalComments: string
  }
  community: {
    id: string
    title: string
    url_title: string | undefined
  }
  user: {
    id: string
    name: string
    avatarUrl: string | undefined | null
  }
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
}

export type NewPostWithAdditionalContent = NewPost & {
  additionalContent: {
    type: PostAdditionalContentType
  }
}
