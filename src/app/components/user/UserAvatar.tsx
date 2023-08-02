import * as Cinnabun from "cinnabun"
import {
  authModalOpen,
  authModalState,
  getUser,
  isAuthenticated,
  isNotAuthenticated,
  userDropdownOpen,
  userStore,
} from "../../state/global"
import { UserIcon } from "../icons/UserIcon"
import { ClickOutsideListener } from "cinnabun/listeners"

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
    <ClickOutsideListener
      tag="div"
      className="user-area flex"
      onCapture={() => (userDropdownOpen.value = false)}
    >
      <button
        type="button"
        className="avatar-wrapper sm rounded-full border-none p-0 bg-primary-darkest"
        onclick={handleLoginClick}
      >
        <UserIcon className="avatar" watch={userStore} bind:visible={isNotAuthenticated} />
        <img
          watch={userStore}
          bind:visible={isAuthenticated}
          bind:src={(self: Cinnabun.Component) => getUser(self)?.picture}
          className="avatar"
          alt="avatar"
        />
      </button>
    </ClickOutsideListener>
  )
}
