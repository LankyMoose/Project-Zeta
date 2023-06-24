import { addNotification } from "../../components/Notifications"
import { API_URL } from "../../constants"
import { Community, NewCommunity } from "../../db/schema"

export const getCommunities = async (page = 0): Promise<Community[] | void> => {
  try {
    const response = await fetch(`${API_URL}/communities?page=${page}`)
    if (!response.ok)
      throw new Error(response.statusText ?? "failed to get communities")

    return response.json()
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const getCommunity = async (id: string): Promise<Community | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}`)
    if (!response.ok)
      throw new Error(response.statusText ?? "failed to get community")

    return response.json()
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const createCommunity = async (
  community: NewCommunity
): Promise<{ id: string } | void> => {
  try {
    const response = await fetch(`${API_URL}/communities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(community),
    })
    if (!response.ok)
      throw new Error(response.statusText ?? "failed to create community")

    return response.json()
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const updateCommunity = async (community: NewCommunity) => {
  try {
    const response = await fetch(`${API_URL}/communities/${community.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(community),
    })
    if (!response.ok)
      throw new Error(response.statusText ?? "failed to update community")

    return response.json()
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}
