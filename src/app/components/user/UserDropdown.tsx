import * as Cinnabun from "cinnabun"
import { Transition } from "cinnabun-transitions"
import { Link } from "cinnabun/router"
import { userDropdownOpen, pathStore } from "../../state/global"
import "./UserDropdown.css"

export const UserDropdown = () => {
  return (
    <div className="user-dropdown-wrapper">
      <Transition
        properties={[
          { name: "opacity", from: 0, to: 1 },
          { name: "translate", from: "0 -100%", to: "0" },
        ]}
        watch={userDropdownOpen}
        bind:visible={() => userDropdownOpen.value}
        className="user-dropdown"
      >
        <div className="user-dropdown-item">
          <Link
            to="/users/me"
            onBeforeNavigate={() => {
              userDropdownOpen.value = false
              return true
            }}
            store={pathStore}
          >
            Profile
          </Link>
        </div>
        <div className="user-dropdown-item">
          <Link
            to="/settings"
            onBeforeNavigate={() => {
              userDropdownOpen.value = false
              return true
            }}
            store={pathStore}
          >
            Settings
          </Link>
        </div>
        <div className="user-dropdown-item">
          <a href="/logout">Log out</a>
        </div>
      </Transition>
    </div>
  )
}
