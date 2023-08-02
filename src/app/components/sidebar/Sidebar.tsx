import * as Cinnabun from "cinnabun"
import { pathStore, sidebarOpen } from "../../../state/global"
import { Link } from "cinnabun/router"
import "./Sidebar.css"
import { UsersIcon } from "../icons/UsersIcon"
import { GlobeIcon } from "../icons/GlobeIcon"
import { SlideInOut, Transition } from "cinnabun-transitions"
import { MenuButton } from "../../components/MenuButton"
import { NavigationListener } from "cinnabun/listeners"

const onBeforeNavigate = () => {
  sidebarOpen.value = false

  return true
}

export const Sidebar = () => {
  return (
    <>
      <Transition
        className="sidebar-background"
        properties={[{ name: "opacity", from: "0", to: "1", ms: 300 }]}
        watch={sidebarOpen}
        bind:visible={() => sidebarOpen.value}
        onclick={() => (sidebarOpen.value = false)}
      />
      <SlideInOut
        settings={{ from: "left" }}
        className="sidebar-container"
        watch={sidebarOpen}
        bind:visible={() => sidebarOpen.value}
      >
        <NavigationListener onCapture={() => (sidebarOpen.value = false)} />
        <header className="sidebar-header">
          <div className="sidebar-header-item">
            <MenuButton />
          </div>
        </header>
        <section className="sidebar-content">
          <div className="sidebar-content-item">
            <Link
              to="/communities"
              onBeforeNavigate={onBeforeNavigate}
              store={pathStore}
              className="sidebar-link"
            >
              <GlobeIcon />
              <span className="collapse-text">Communities</span>
            </Link>
          </div>
          <div className="sidebar-content-item">
            <Link
              onBeforeNavigate={onBeforeNavigate}
              to="/users"
              store={pathStore}
              className="sidebar-link"
            >
              <UsersIcon />
              <span className="collapse-text">Users</span>
            </Link>
          </div>
        </section>
        <section className="sidebar-footer">
          <div className="sidebar-footer-item">
            <Link
              onBeforeNavigate={onBeforeNavigate}
              to="/settings"
              store={pathStore}
              className="sidebar-link"
            >
              <span className="collapse-text">Settings</span>
            </Link>
          </div>
        </section>
      </SlideInOut>
    </>
  )
}
