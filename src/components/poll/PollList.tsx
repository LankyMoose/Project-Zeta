import * as Cinnabun from "cinnabun"
import { Cinnabun as cb } from "cinnabun"
import { For } from "cinnabun"
import { getPolls } from "../../client/actions/polls"
import { PollData } from "../../types/polls"
import { PollCard } from "./PollCard"
import { LiveSocket } from "../../client/liveSocket"

let serverData = Cinnabun.createSignal<PollData[]>([])

export const PollList = () => {
  if (!cb.isClient) {
    getPolls().then((res) => {
      serverData.value = res
    })
  }

  const polls = cb.isClient
    ? cb.getRuntimeService(LiveSocket).polls
    : serverData

  return (
    <div className="list-container">
      <ul className="card-list">
        <For each={polls} template={(item) => <PollCard {...item} />} />
      </ul>
    </div>
  )
}
