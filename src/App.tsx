import * as Cinnabun from "cinnabun"
import { Router, Route, Link } from "cinnabun/router"
import { AuthLinks } from "./components/AuthLinks"
import { Portal } from "./components/Portal"
import { NotificationTray } from "./components/Notifications"
import { pathStore } from "./state"

import HomePage from "./pages/Home"
import CommunitiesPage from "./pages/Communities"
import CommunityPage from "./pages/Community/Page"
import CommunityPostPage from "./pages/Community/Post"
import CommunityMembersPage from "./pages/Community/Members"
import { CommunityCreator } from "./components/communities/CommunityCreator"
import { PostCreator } from "./components/community/PostCreator"

const Header = () => {
  return (
    <header>
      <Link to="/" store={pathStore}>
        <div id="logo">Zetabase</div>
      </Link>

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

          <Route path="/communities/:communityId" component={CommunityPage} />
          <Route
            path="/communities/:communityId/:postId"
            component={CommunityPostPage}
          />
          <Route
            path="/communities/:communityId/members"
            component={CommunityMembersPage}
          />
        </Router>
      </main>
      <Portal>
        <NotificationTray />
        <PostCreator />
        <CommunityCreator />
      </Portal>
    </>
  )
}
