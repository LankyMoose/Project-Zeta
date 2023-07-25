import * as Cinnabun from "cinnabun"
import {
  authModalOpen,
  authModalState,
  isAuthenticated,
  isNotAuthenticated,
  userDropdownOpen,
  userStore,
} from "../state"
import { UserIcon } from "./icons/UserIcon"
import { UserDropdown } from "./UserDropdown"

export const UserAvatar = () => {
  const handleLoginClick = () => {
    if (userStore.value) {
      userDropdownOpen.value = !userDropdownOpen.value
      return
    }
    authModalState.value = {
      title: "Log in",
      message: `Welcome (back?) to Zetabase - a place for
       people, apache helicopters and anyone (or anything) 
       else that's looking for someplace better.

        Try not to be a ****! Unless, of course, you
        join one of the various '****' communities.`,
      callbackAction: undefined,
    }
    authModalOpen.value = true
  }
  return (
    <div className="user-area">
      <button
        type="button"
        className="avatar-wrapper sm rounded-full border-none p-0"
        onclick={handleLoginClick}
      >
        <UserIcon className="avatar" watch={userStore} bind:visible={isNotAuthenticated} />
        <img
          watch={userStore}
          bind:visible={isAuthenticated}
          className="avatar"
          src={userStore.value?.picture}
          alt="avatar"
        />
      </button>
      <UserDropdown />
    </div>
  )
}
