import * as Cinnabun from "cinnabun"
import { isAuthenticated, isNotAuthenticated, userStore } from "../state"

export const AuthLinks = () => (
  <>
    <a
      href="/login/google"
      className="btn btn-primary hover-animate text-rg"
      watch={userStore}
      bind:visible={isNotAuthenticated}
    >
      <span>Log in with Google</span>
    </a>
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
