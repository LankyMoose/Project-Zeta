import * as Cinnabun from "cinnabun"
import { Router, Route, Link } from "cinnabun/router"
import { UserAvatar } from "./components/UserAvatar"
import { Portal } from "./components/Portal"
import { NotificationTray } from "./components/Notifications"
import { pathStore } from "./state/global"

import HomePage from "./pages/Home"
import CommunitiesPage from "./pages/Communities"
import CommunityPage from "./pages/Community/Page"
import UserPage from "./pages/User/Page"

import { CommunityCreator } from "./components/communities/CommunityCreator"
import { PostCreator } from "./components/community/PostCreator"
import { CommunityEditor } from "./components/community/CommunityEditor"
import { CommunityJoinPrompt } from "./components/community/CommunityJoinPrompt"
import { AuthModal } from "./components/auth/AuthModal"
import { CommunitySearch } from "./components/communities/CommunitySearch"
import { Sidebar } from "./components/sidebar/Sidebar"
import { MenuButton } from "./components/MenuButton"
import { CommunityDrawer } from "./components/community/CommunityDrawer"
import { CommunityLeaveConfirmation } from "./components/community/CommunityLeaveConfirmation"
import { CommunityDeleteConfirmation } from "./components/community/CommunityDeleteConfirmation"
import { UserDropdown } from "./components/UserDropdown"
import { PostModal } from "./components/post/PostModal"

const Header = () => (
  <header>
    <MenuButton className="hide-sm" />
    <Link to="/" store={pathStore}>
      <div id="logo">Project Zeta</div>
    </Link>

    <CommunitySearch />
    <>
      <ul id="main-header-menu" className="none flex-sm">
        <li>
          <Link to="/communities" store={pathStore}>
            <small>Communities</small>
          </Link>
        </li>
        <li>
          <Link to="/users" store={pathStore}>
            <small>Users</small>
          </Link>
        </li>
      </ul>
    </>

    <UserAvatar />
  </header>
)

export const App = () => {
  return (
    <>
      <Header />
      <UserDropdown />
      <div className="app-main">
        <Sidebar />
        <main className="container">
          <Router store={pathStore}>
            <Route path="/" component={HomePage} />
            <Route path="/communities" component={CommunitiesPage} />
            <Route path="/communities/:url_title" component={CommunityPage} />
            <Route path="/users" component={<div>Users</div>} />
            <Route path="/users/:userId" component={UserPage} />
          </Router>
        </main>
      </div>
      <Portal>
        <NotificationTray />
        <PostCreator />
        <CommunityCreator />
        <CommunityEditor />
        <CommunityJoinPrompt />
        <AuthModal />
        <CommunityDrawer />
        <CommunityLeaveConfirmation />
        <CommunityDeleteConfirmation />
        <PostModal />
      </Portal>
    </>
  )
}
