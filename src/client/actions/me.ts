import { addNotification } from "../../components/Notifications"
import { API_URL } from "../../constants"

export const getLatestPostsFromMyCommunities = async (page = 0) => {
  try {
    const response = await fetch(`${API_URL}/me/latest?page=${page}`)
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
