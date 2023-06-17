import * as Cinnabun from "cinnabun"
import { isAuthenticated, isNotAuthenticated, userStore } from "../state"

export const AuthLinks = () => (
  <>
    <a href="/login/google" watch={userStore} bind:visible={isNotAuthenticated}>
      Log in with Google
    </a>
    <a href="/logout" watch={userStore} bind:visible={isAuthenticated}>
      Log out
    </a>
  </>
)
