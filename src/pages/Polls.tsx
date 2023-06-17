import * as Cinnabun from "cinnabun"
import { PollList } from "../components/poll/PollList"
import { Button } from "../components/Button"
import { isAuthenticated, userStore } from "../state"

export const PollsPage = () => {
  return (
    <section className="page-body">
      <div className="page-title">
        <h1>Polls</h1>
        <Button
          watch={userStore}
          bind:visible={isAuthenticated}
          className="btn btn-primary text-rg"
        >
          Create Poll
        </Button>
      </div>
      <hr />
      <PollList />
    </section>
  )
}
