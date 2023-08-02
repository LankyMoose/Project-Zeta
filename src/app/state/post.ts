import { CommunityPostDataWithComments } from "../../types/post"
import { createSignal } from "cinnabun"

export const postModalOpen = createSignal(false)
export const selectedPost = createSignal<Partial<CommunityPostDataWithComments> | null>(null)
export const postCommentsPage = createSignal(0)
