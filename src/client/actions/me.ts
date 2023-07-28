import { addNotification } from "../../components/Notifications"
import { API_URL } from "../../constants"
import { MyCommunitiesData } from "../../types/community"
import { CommunityPostListData } from "../../types/post"

export const getLatestPostsFromMyCommunities = async (
  page = 0
): Promise<CommunityPostListData[] | void> => {
  try {
    const response = await fetch(`${API_URL}/me/from-my-communities?page=${page}`)
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
