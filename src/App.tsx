import * as Cinnabun from "cinnabun"
import { Router, Route, Link } from "cinnabun/router"
import { pathStore } from "./state"
import { UserList } from "./components/UserList"
import { AuthLinks } from "./components/AuthLinks"
import { Portal } from "./components/Portal"
import { NotificationTray } from "./components/Notifications"
import { PollList } from "./components/poll/PollList"
import { PollCreator } from "./components/poll/PollCreator"

const Navigation = () => (
  <nav>
    <ul>
      <li>
        <Link to="/users" store={pathStore}>
          Users
        </Link>
      </li>
      <li>
        <AuthLinks />
      </li>
    </ul>
  </nav>
)

const Header = () => {
  return (
    <header>
      <Link to="/" store={pathStore}>
        <div id="logo">Logo</div>
      </Link>

      <div className="flex gap align-items-center">
        <PollCreator />
        <Navigation />
      </div>
    </header>
  )
}

export const App = () => {
  return (
    <>
      <Header />
      <main>
        <Router store={pathStore}>
          <Route path="/" component={<PollList />} />
          <Route path="/users" component={<UserList />} />
        </Router>
      </main>
      <Portal>
        <NotificationTray />
      </Portal>
    </>
  )
}
