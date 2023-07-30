import { createSignal } from "cinnabun"
import { ComponentFunc } from "cinnabun/types"
import { CommunityData, CommunityJoinRequestData } from "../types/community"
import { CommunityPostComment, CommunityPostData } from "../types/post"

export const postCreatorModalOpen = createSignal(false)
export const communityCreatorModalOpen = createSignal(false)
export const communityEditorModalOpen = createSignal(false)
export const communityJoinModalOpen = createSignal(false)
export const communityLeaveModalOpen = createSignal(false)
export const communityDeleteModalOpen = createSignal(false)
export const communityOwnershipTransferModalOpen = createSignal(false)

export const postModalOpen = createSignal(false)
export const selectedPostComments = createSignal<CommunityPostComment[]>([])

export const selectedCommunity = createSignal<Partial<CommunityData> | null>(null)
export const selectedCommunityPost = createSignal<Partial<CommunityPostData> | null>(null)
export const pendingCommunityJoinRequests = createSignal<CommunityJoinRequestData[]>([])

export const communityDrawerOpen = createSignal(false)
export const communityDrawerState = createSignal({
  title: "",
  componentFunc: null as ComponentFunc | null,
})

export const communityRole = () => {
  if (!selectedCommunity.value) return null
  return selectedCommunity.value.memberType
}

export const communityHasMembers = () => {
  if (!selectedCommunity.value) return false
  console.log(selectedCommunity.value)
  return (
    (selectedCommunity.value.members ?? []).length > 0 ||
    (selectedCommunity.value.moderators ?? []).length > 0
  )
}

export const isCommunityMember = () => {
  if (!selectedCommunity.value) return true
  return selectedCommunity.value.memberType !== "guest"
}

export const isCommunityOwner = () => {
  return selectedCommunity.value?.memberType === "owner"
}

export const isCommunityModerator = () => {
  return selectedCommunity.value?.memberType === "moderator"
}

export const isCommunityAdmin = () => {
  return isCommunityModerator() || isCommunityOwner()
}
