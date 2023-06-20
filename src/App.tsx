import * as Cinnabun from "cinnabun"
import { AuthLinks } from "./components/AuthLinks"
import { Portal } from "./components/Portal"
import { NotificationTray } from "./components/Notifications"
import { PollList } from "./components/poll/PollList"
import { PollCreator } from "./components/poll/PollCreator"

const Header = () => {
  return (
    <header>
      <div id="logo">Logo</div>

      <div className="flex gap align-items-center">
        <PollCreator />
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
        <PollList />
      </main>
      <Portal>
        <NotificationTray />
      </Portal>
    </>
  )
}
