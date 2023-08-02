import { Community, User } from "../db/schema"

export type CommunityLinkData = { title: string; url_title: string }
export type CommunitySearchData = {
  search: string
  communities: CommunityLinkData[]
}

export type CommunityListData = {
  members: string | number
  community: Community
}

export type MyCommunitiesData = {
  owned: CommunityListData[]
  moderated: CommunityListData[]
  member: CommunityListData[]
}

export type CommunityJoinRequestData = {
  id: string
  createdAt: Date
  user: User
  communityId: string
}

export type CommunityMemberUserData = {
  avatarUrl?: string | null
  createdAt: string | Date
  id: string
  name: string
}

export type CommunityMemberData = {
  id: string
  communityId: string
  userId: string
  user: CommunityMemberUserData
  createdAt: string | Date
  memberType: "member" | "moderator" | "owner"
  disabled: boolean | null
}

export type CommunityData = {
  createdAt: string
  description: string
  disabled: boolean
  id: string
  members: CommunityMemberData[]
  moderators: CommunityMemberData[]
  owners: CommunityMemberData[]
  title: string
  url_title: string
  private: boolean
  memberType: "member" | "moderator" | "owner" | "guest"
  nsfw: boolean | null
}

export enum JoinResultType {
  Success,
  Pending,
  AlreadyJoined,
  Error,
  Banned,
}

export type JoinResult = {
  type: JoinResultType
  message?: string
}

export enum LeaveResultType {
  Success,
  NotAMember,
  Error,
}
export type LeaveResult = {
  type: LeaveResultType
  message?: string
}

export enum DeleteResultType {
  Success,
  Error,
}
export type DeleteResult = {
  type: DeleteResultType
  message?: string
}

export enum OwnershipTransferResultType {
  Success,
  Error,
}

export type OwnershipTransferResult = {
  type: OwnershipTransferResultType
  message?: string
}
