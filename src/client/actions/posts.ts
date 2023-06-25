import { addNotification } from "../../components/Notifications"
import { API_URL } from "../../constants"
import { NewPost } from "../../db/schema"

export const getPost = async (postId: string) => {
  try {
    const response = await fetch(`${API_URL}/posts/${postId}`)
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

export const addPostComment = async (postId: string, comment: string) => {
  try {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
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

export const addPostReaction = async (postId: string, reaction: boolean) => {
  try {
    const response = await fetch(`${API_URL}/posts/${postId}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reaction }),
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

export const addPost = async (post: NewPost) => {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message ?? response.statusText)

    return data
  } catch (error: any) {
    console.error(error)
    addNotification({
      type: "error",
      text: error.message,
    })
  }
}

export const getPosts = async (communityId: string, offset: number) => {
  try {
    const response = await fetch(`${API_URL}/posts?communityId=${communityId}&offset=${offset}`)
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
