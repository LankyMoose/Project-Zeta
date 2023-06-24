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

const Header = () => {
  return (
    <header>
      <Link to="/" store={pathStore}>
        <div id="logo">Logo</div>
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
          <Route path="/" component={<HomePage />} />
          <Route path="/communities" component={<CommunitiesPage />} />

          <Route
            path="/communities/:communityId"
            component={(props) => <CommunityPage {...props} />}
          />
          <Route
            path="/communities/:communityId/:postId"
            component={(props) => <CommunityPostPage {...props} />}
          />
          <Route
            path="/communities/:communityId/members"
            component={(props) => <CommunityMembersPage {...props} />}
          />
        </Router>
      </main>
      <Portal>
        <NotificationTray />
      </Portal>
    </>
  )
}
