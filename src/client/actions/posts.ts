import { addNotification } from "../../components/Notifications"
import { API_URL } from "../../constants"
import { NewPost, PostReaction } from "../../db/schema"
import { CommunityPostComment, CommunityPostData } from "../../types/post"

export const getPostComments = async (
  communityId: string,
  postId: string,
  offset: number
): Promise<CommunityPostComment[] | void> => {
  try {
    const response = await fetch(
      `${API_URL}/communities/${communityId}/posts/${postId}/comments?offset=${offset}`
    )
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

export const addPostReaction = async (
  postId: string,
  reaction: boolean
): Promise<PostReaction | void> => {
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

export const getPost = async (
  communityId: string,
  postId: string
): Promise<CommunityPostData | void> => {
  try {
    const response = await fetch(`${API_URL}/communities/${communityId}/posts/${postId}`)
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
