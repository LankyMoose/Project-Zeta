import * as Cinnabun from "cinnabun"
import { Cinnabun as cb, Signal } from "cinnabun"
import { For } from "cinnabun"
import { PollData } from "../../types/polls"
import { PollCard } from "./PollCard"
import { LiveSocket } from "../../client/liveSocket"
import { DefaultLoader } from "../loaders/Default"

const isClient = cb.isClient
export const PollList = () => {
  const polls = isClient ? cb.getRuntimeService(LiveSocket).polls : []

  return (
    <div className="list-container">
      <DefaultLoader
        watch={polls}
        bind:visible={() =>
          !isClient ||
          (isClient && (polls as Signal<PollData[]>).value.length === 0)
        }
      />
      <ul className="card-list">
        <For
          each={isClient ? cb.getRuntimeService(LiveSocket).polls : []}
          template={(item) => <PollCard {...item} />}
        />
      </ul>
    </div>
  )
}
