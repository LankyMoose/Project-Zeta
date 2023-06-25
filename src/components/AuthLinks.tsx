import * as Cinnabun from "cinnabun"
import {
  authModalOpen,
  authModalState,
  isAuthenticated,
  isNotAuthenticated,
  userStore,
} from "../state"
import { Button } from "./Button"

export const AuthLinks = () => {
  const handleLoginClick = () => {
    authModalState.value = {
      title: "Log in",
      message: `Welcome (back?) to Zetabase - a place for
       people, apache helicopters and anyone (or anything) 
       else who is sick of other communities but for some reason
        thinks it might be different here.
        
        Try not to be a ****! Unless, of course, you
        join one of the various '****' communities.`,
      callbackAction: undefined,
    }
    authModalOpen.value = true
  }
  return (
    <>
      <Button
        type="button"
        className="btn btn-primary hover-animate text-rg"
        watch={userStore}
        bind:visible={isNotAuthenticated}
        onclick={handleLoginClick}
      >
        Log in
      </Button>
      <a
        href="/logout"
        className="btn btn-secondary hover-animate text-rg"
        watch={userStore}
        bind:visible={isAuthenticated}
      >
        <span>Log out</span>
      </a>
    </>
  )
}
