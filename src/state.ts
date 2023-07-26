import { Cinnabun, Component, createSignal } from "cinnabun"
import { PublicUser } from "./types/user"
import { CommunityData, CommunityJoinRequestData } from "./types/community"
import { AuthModalCallback } from "./types/auth"
import { ComponentFunc } from "cinnabun/types"

const isClient = Cinnabun.isClient

export const pathStore = createSignal(isClient ? window.location.pathname : "/")

const decodeCookie = (str: string) =>
  str
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim())
      return acc
    }, {} as Record<string, any>)

const getUserDataFromCookie = (): PublicUser | null => {
  if (!window.document.cookie) return null
  const { user } = decodeCookie(window.document.cookie)
  if (!user) return null
  const parsed = JSON.parse(user)
  return parsed ?? null
}

export const userStore = createSignal<PublicUser | null>(isClient ? getUserDataFromCookie() : null)

export const getUser = (self: Component) =>
  self.useRequestData<PublicUser | null>("data.user", userStore.value)

export const isAuthenticated = (self: Component) => !!getUser(self)
export const isNotAuthenticated = (self: Component) => !getUser(self)

export const isCommunityMember = () => {
  if (!selectedCommunity.value) return true
  return selectedCommunity.value.memberType !== "guest"
}
export const authModalOpen = createSignal(false)
export const authModalState = createSignal({
  title: "",
  message: "",
  callbackAction: undefined as AuthModalCallback | undefined,
})
export const postCreatorModalOpen = createSignal(false)
export const communityCreatorModalOpen = createSignal(false)
export const communityEditorModalOpen = createSignal(false)
export const communityJoinModalOpen = createSignal(false)
export const communityLeaveModalOpen = createSignal(false)
export const communityDeleteModalOpen = createSignal(false)
export const communityOwnershipTransferModalOpen = createSignal(false)

export const selectedCommunity = createSignal<Partial<CommunityData> | null>(null)
export const selectedCommunityPost = createSignal<string | null>(null)
export const pendingCommunityJoinRequests = createSignal<CommunityJoinRequestData[]>([])

export const sidebarOpen = createSignal(false)
export const userDropdownOpen = createSignal(false)

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

export const isCommunityOwner = () => {
  return selectedCommunity.value?.memberType === "owner"
}

export const isCommunityModerator = () => {
  return selectedCommunity.value?.memberType === "moderator"
}

export const isCommunityAdmin = () => {
  return isCommunityModerator() || isCommunityOwner()
}
