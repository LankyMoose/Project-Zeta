import { Post } from "../db/schema"

type CommunityPostReaction = {
  reaction: boolean
  ownerId: string
}

export type CommunityPostData = Post & {
  user: {
    id: string
    name: string
    avatarUrl: string
  }
  comments: {
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string
      avatarUrl: string
    }
  }[]
  reactions: CommunityPostReaction[]
}
