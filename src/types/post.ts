import { Post } from "../db/schema"
import { CommunityMemberUserData } from "./community"

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

export type CommunityPostListData = {
  community: {
    id: string
    title: string
    url_title: string | null
  }
  post: Post
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}
