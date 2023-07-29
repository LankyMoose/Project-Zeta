import { addNotification } from "../../components/Notifications"
import { API_URL } from "../../constants"
import { Community, NewCommunity } from "../../db/schema"
import {
  CommunityData,
  CommunityJoinRequestData,
  CommunityListData,
  CommunityMemberData,
  CommunitySearchData,
  JoinResult,
  LeaveResult,
} from "../../types/community"
import { LatestPostsData } from "../../types/post"

export const getCommunitySearch = async (title: string): Promise<CommunitySearchData | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/search?title=${title}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const getCommunities = async (page = 0): Promise<CommunityListData[] | void> => {
  try {
    const response = await fetch(`${API_URL}/communities?page=${page}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const getCommunity = async (id: string): Promise<Partial<CommunityData> | Error> => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}`)
    return await response.json()
  } catch (error: any) {
    return new Error(error.message)
  }
}

export const getLatestPostsCommunities = async (page = 0): Promise<LatestPostsData[] | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/latest?page=${page}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const getCommunityJoinRequests = async (
  id: string
): Promise<CommunityJoinRequestData[] | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}/join-requests`)
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const respondToCommunityJoinRequest = async (
  communityId: string,
  requestId: string,
  accepted: boolean
): Promise<CommunityMemberData | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/${communityId}/join-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId, accepted }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const createCommunity = async (
  community: Omit<NewCommunity, "url_title">
): Promise<{ id: string } | void> => {
  try {
    const response = await fetch(`${API_URL}/communities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(community),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const updateCommunity = async (community: NewCommunity): Promise<Community | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/${community.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(community),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const joinCommunity = async (url_title: string): Promise<JoinResult | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/${url_title}/join`, {
      method: "POST",
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const leaveCommunity = async (id: string): Promise<LeaveResult | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}/leave`, {
      method: "POST",
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const deleteCommunity = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}`, {
      method: "DELETE",
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)
    return true
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
    return false
  }
}

export const updateCommunityMemberType = async (
  communityId: string,
  userId: string,
  memberType: "member" | "moderator" | "owner" | "none"
): Promise<CommunityMemberData | { type: string } | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/${communityId}/members`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, memberType }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)
    return data
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}
