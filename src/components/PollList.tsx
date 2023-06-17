import * as Cinnabun from "cinnabun"
import { Suspense, For } from "cinnabun"
import { PollListResponse, getPolls } from "../client/actions/polls"

export const PollList = () => {
  return (
    <Suspense promise={getPolls} cache>
      {(loading: boolean, data: PollListResponse) => {
        if (loading) return <div>Loading...</div>
        console.log(data)
        return (
          data && (
            <ul>
              <For each={data.polls} template={(poll) => <li key={poll.id}>{poll.desc}</li>} />
            </ul>
          )
        )
      }}
    </Suspense>
  )
}
