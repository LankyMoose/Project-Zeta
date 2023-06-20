import * as Cinnabun from "cinnabun"
import { Cinnabun as cb } from "cinnabun"
import { PollData } from "../../types/polls"
import { PollOptionButton } from "./PollOptionButton"
import { getTotalVotes } from "./utils"
import { LiveSocket } from "../../client/liveSocket"
//import { userStore } from "../../state"

export const PollCard = (props: PollData) => {
  const state = Cinnabun.createSignal(props)
  const titleText = props.poll.desc
  const titleClass =
    "card-title " +
    (titleText.length > 128
      ? "x-small"
      : titleText.length > 64
      ? "small"
      : "large")

  let unsub: { (): void } | undefined = undefined
  const onMounted = () => {
    unsub = cb.getRuntimeService(LiveSocket).polls.subscribe((newVal) => {
      for (const pollData of newVal) {
        if (pollData.poll.id === props.poll.id) {
          state.value = pollData
          break
        }
      }
    })
  }
  const onUnmounted = () => {
    if (!unsub) return
    unsub()
  }

  return (
    <div
      onMounted={onMounted}
      onUnmounted={onUnmounted}
      key={props.poll.id}
      className="card"
    >
      <h3 className={titleClass}>{titleText}</h3>
      <div style="display:flex; flex-direction:column; gap:1rem">
        <Cinnabun.For
          each={props.options}
          template={(option) => (
            <PollOptionButton option={option} pollData={props} />
          )}
        />
      </div>
      <div>
        <small watch={state} bind:children className="text-muted">
          Total votes: {() => getTotalVotes(state.value)}
        </small>
      </div>
    </div>
  )
}
