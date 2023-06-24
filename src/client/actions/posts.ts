import { addNotification } from "../../components/Notifications"
import { API_URL } from "../../constants"
import { NewPost } from "../../db/schema"

export const addPost = async (post: NewPost) => {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    })
    if (!response.ok)
      throw new Error(response.statusText ?? "failed to add post")

    return response.json()
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const getPosts = async (communityId: string, offset: number) => {
  try {
    const response = await fetch(
      `${API_URL}/posts?communityId=${communityId}&offset=${offset}`
    )
    if (!response.ok)
      throw new Error(response.statusText ?? "failed to get posts")

    return response.json()
  } catch (error: any) {
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}
