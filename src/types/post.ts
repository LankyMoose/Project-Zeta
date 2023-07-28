import { Post } from "../db/schema"

export type CommunityPostReaction = {
  reaction: boolean
  ownerId: string
}
export type CommunityPostComment = {
  id: string
  content: string
  createdAt: string | Date
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export type CommunityPostData = Post & {
  user: {
    id: string
    name: string
    avatarUrl: string
  }
  comments: CommunityPostComment[]
  reactions: CommunityPostReaction[]
}

export type LatestPostsData = {
  post: {
    id: string
    title: string
    content: string
    createdAt: Date | string
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
