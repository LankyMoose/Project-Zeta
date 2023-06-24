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
  owner: CommunityMemberData
  posts: any[]
  title: string
}
