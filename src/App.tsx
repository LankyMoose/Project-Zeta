import * as Cinnabun from "cinnabun"
import { Router, Route, Link } from "cinnabun/router"
import { UserAvatar } from "./components/UserAvatar"
import { Portal } from "./components/Portal"
import { NotificationTray } from "./components/Notifications"
import { pathStore } from "./state"

import HomePage from "./pages/Home"
import CommunitiesPage from "./pages/Communities"
import CommunityPage from "./pages/Community/Page"
import { CommunityCreator } from "./components/communities/CommunityCreator"
import { PostCreator } from "./components/community/PostCreator"
import { CommunityEditor } from "./components/community/CommunityEditor"
import { CommunityJoinPrompt } from "./components/community/CommunityJoinPrompt"
import { AuthModal } from "./components/auth/AuthModal"
import { CommunitySearch } from "./components/communities/CommunitySearch"
import { Sidebar } from "./components/sidebar/Sidebar"
import { MenuButton } from "./components/MenuButton"

const Header = () => (
  <header>
    <MenuButton />
    <Link to="/" store={pathStore}>
      <div id="logo">Zetabase</div>
    </Link>

    <CommunitySearch />
    <>
      <ul id="main-header-menu" className="hide-sm">
        <li>
          <Link to="/communities" store={pathStore}>
            <small>Communities</small>
          </Link>
        </li>
        <li>
          <Link to="/people" store={pathStore}>
            <small>People</small>
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
      <div className="app-main">
        <Sidebar />
        <main className="container">
          <Router store={pathStore}>
            <Route path="/" component={HomePage} />
            <Route path="/communities" component={CommunitiesPage} />
            <Route path="/communities/:url_title" component={CommunityPage} />
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
      </Portal>
    </>
  )
}
