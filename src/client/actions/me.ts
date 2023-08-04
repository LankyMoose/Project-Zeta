import { addNotification } from "../../app/components/notifications/Notifications"
import { API_URL } from "../../constants"
import { MyCommunitiesData } from "../../types/community"

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
