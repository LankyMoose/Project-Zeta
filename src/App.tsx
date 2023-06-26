import * as Cinnabun from "cinnabun"
import { Router, Route, Link } from "cinnabun/router"
import { AuthLinks } from "./components/AuthLinks"
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

const Header = () => {
  return (
    <header>
      <Link to="/" store={pathStore}>
        <div id="logo">Zetabase</div>
      </Link>

      <CommunitySearch />

      <div className="flex gap align-items-center">
        <Link to="/communities" store={pathStore}>
          Communities
        </Link>
        <AuthLinks />
      </div>
    </header>
  )
}

export const App = () => {
  return (
    <>
      <Header />
      <main className="container">
        <Router store={pathStore}>
          <Route path="/" component={HomePage} />
          <Route path="/communities" component={CommunitiesPage} />
          <Route path="/communities/:url_title" component={CommunityPage} />
        </Router>
      </main>
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
