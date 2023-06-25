import { CommunityPostData } from "./post"

export type CommunityMemberUserData = {
  avatarUrl?: string
  createdAt: string | Date
  id: string
  name: string
}

export type CommunityMemberData = {
  id: string
  communityId: string
  userId: string
  user: CommunityMemberUserData
  createdAt: string
  memberType: "member" | "moderator" | "owner"
  disabled: boolean
}

export type CommunityData = {
  createdAt: string
  description: string
  disabled: boolean
  id: string
  members: CommunityMemberData[]
  moderators: CommunityMemberData[]
  owners: CommunityMemberData[]
  posts: CommunityPostData[]
  title: string
  url_title: string
  private: boolean
  memberType: "member" | "moderator" | "owner" | "guest"
}

export enum JoinResultType {
  Success,
  Pending,
  AlreadyJoined,
  Error,
}

export type JoinResult = {
  type: JoinResultType
  message?: string
}
