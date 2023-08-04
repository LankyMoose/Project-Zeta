import { addNotification } from "../../app/components/notifications/Notifications"
import { API_URL } from "../../constants"
import { MyCommunitiesData } from "../../types/community"
import { PublicUser } from "../../types/user"

export const getMyCommunities = async (): Promise<MyCommunitiesData | void> => {
  try {
    const response = await fetch(`${API_URL}/me/communities`)
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

export const getUpdateDpUrl = async (): Promise<{ url: string } | void> => {
  try {
    const response = await fetch(`${API_URL}/me/update-dp`)
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

export const confirmUpdateDp = async (key: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/me/update-dp/confirm?url=${key}`)
    return response.ok
  } catch (error: any) {
    return false
  }
}

export const updateName = async (name: string): Promise<PublicUser | void> => {
  try {
    const response = await fetch(`${API_URL}/me/name`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
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
