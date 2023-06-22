import * as Cinnabun from "cinnabun"
import { Cinnabun as cb, createSignal } from "cinnabun"
import { For } from "cinnabun"
import { PollCard } from "./PollCard"
import { LiveSocket } from "../../client/liveSocket"
import { DefaultLoader } from "../loaders/Default"

const isClient = cb.isClient

export const PollList = () => {
  const liveSocket = cb.getRuntimeService(LiveSocket)
  const loading = isClient ? liveSocket.loading : createSignal(true)

  const polls = isClient ? liveSocket.polls : []

  return (
    <div className="list-container">
      <DefaultLoader watch={loading} bind:visible={() => loading.value} />

      <ul className="card-list">
        <For each={polls} template={(item) => <PollCard {...item} />} />
      </ul>
    </div>
  )
}
