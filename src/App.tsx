import * as Cinnabun from "cinnabun"
import { Router, Route, Link } from "cinnabun/router"
import { Logo } from "./Logo"
import { pathStore } from "./state"
import { UserList } from "./components/UserList"
import { PollList } from "./components/PollList"

const Navigation = () => (
  <nav>
    <ul>
      <li>
        <Link to="/" store={pathStore}>
          Home
        </Link>
      </li>
      <li>
        <Link to="/users" store={pathStore}>
          Users
        </Link>
      </li>
      <li>
        <Link to="/polls" store={pathStore}>
          Polls
        </Link>
      </li>
    </ul>
  </nav>
)

export const App = () => {
  return (
    <div>
      <h1>Cinnabun JS</h1>
      <br />
      <Logo />
      <br />
      <h2>Get started by editing App.tsx!</h2>

      <Navigation />
      <Router store={pathStore}>
        <Route path="/" component={<h3>Home</h3>} />
        <Route path="/users" component={<UserList />} />
        <Route path="/polls" component={<PollList />} />
      </Router>

      <footer>
        <span style={{ color: "#ccc" }}>Made with love and friends 💞</span>
        <a target="_new" href="https://github.com/Midnight-Pantry/cinnabun">
          Github
        </a>
        <a target="_new" href="https://github.com/Midnight-Pantry/cinnabun/tree/main/apps/components/src">
          Component Examples
        </a>
      </footer>
    </div>
  )
}
