import { Post } from "../db/schema"

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
  reactions: {
    reaction: string
  }[]
}
