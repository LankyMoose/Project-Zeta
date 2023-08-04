import { PostWithMetaWithComments } from "../../types/post"
import { createSignal } from "cinnabun"

export const postModalOpen = createSignal(false)
export const selectedPost = createSignal<Partial<PostWithMetaWithComments> | null>(null)
export const postCommentsPage = createSignal(0)
