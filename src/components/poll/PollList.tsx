import * as Cinnabun from "cinnabun"
import { Suspense, For } from "cinnabun"
import { getPolls } from "../../client/actions/polls"
import { PollData } from "../../types/polls"
import { PollCard } from "./PollCard"

export const PollList = () => {
  return (
    <Suspense promise={getPolls} cache prefetch:defer>
      {(loading: boolean, items: PollData[]) => {
        if (loading) return <div>Loading...</div>
        return (
          items?.length && (
            <ul className="card-list">
              <For each={items} template={(item) => <PollCard {...item} />} />
            </ul>
          )
        )
      }}
    </Suspense>
  )
}
