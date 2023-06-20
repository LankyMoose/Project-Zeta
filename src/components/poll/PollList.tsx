import * as Cinnabun from "cinnabun"
import { Suspense, For } from "cinnabun"
import { getPolls } from "../../client/actions/polls"
import { PollData } from "../../types/polls"
import { PollCard } from "./PollCard"

export const PollList = () => {
  return (
    <div className="list-container">
      <Suspense promise={getPolls} cache>
        {(loading: boolean, items: PollData[]) => {
          if (loading) return <i className="text-muted text-lg">Loading...</i>
          return (
            (items?.length && (
              <ul className="card-list">
                <For each={items} template={(item) => <PollCard {...item} />} />
              </ul>
            )) || <i className="text-muted text-lg">No polls found 😢</i>
          )
        }}
      </Suspense>
    </div>
  )
}
