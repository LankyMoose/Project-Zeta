import * as Cinnabun from "cinnabun"
import { Cinnabun as cb } from "cinnabun"
import "./PollOptionButton.css"
import { vote } from "../../client/actions/polls"
import { addNotification } from "../Notifications"
import { LiveSocket } from "../../client/liveSocket"
import { PollData } from "../../types/polls"
import { userStore } from "../../state"
import { getTotalVotes } from "./utils"

const getPercent = (pollData: PollData, votes: number) => {
  const totalVotes = getTotalVotes(pollData)
  if (totalVotes === 0) return 0
  return (votes / totalVotes) * 100
}

export const PollOptionButton = (props: {
  option: PollData["options"][0]
  pollData: PollData
}) => {
  const state = Cinnabun.createSignal(props)

  const voteForOption = async (id: string) => {
    if (!userStore.value)
      return addNotification({
        text: "You must be logged in to vote",
        type: "error",
      })
    const res = await vote(props.pollData.poll.id, id)
    addNotification({
      text: res ? "Voted!" : "Failed to vote",
      type: res ? "success" : "error",
    })
  }

  let unsub: { (): void } | undefined = undefined
  const onMounted = () => {
    unsub = cb.getRuntimeService(LiveSocket).polls.subscribe((newVal) => {
      for (const pollData of newVal) {
        if (pollData.poll.id === props.pollData.poll.id) {
          state.value.option = pollData.options.find(
            (option) => option.id === props.option.id
          )!
          state.value.pollData = pollData
          state.notify()
        }
      }
    })
  }
  const onUnmounted = () => {
    if (!unsub) return
    unsub()
  }

  const getPollVoteCounts = () => state.value.pollData.voteCounts

  const hasVoted = () => getPollVoteCounts()[state.value.option.id]?.hasVoted
  const votes = () => getPollVoteCounts()[state.value.option.id]?.count || 0

  return (
    <button
      watch={state}
      onMounted={onMounted}
      onUnmounted={onUnmounted}
      key={props.option.id}
      onclick={() => voteForOption(props.option.id.toString())}
      bind:className={() => "poll-option" + (hasVoted() ? " voted" : "")}
      bind:style={() =>
        `--percent: ${getPercent(state.value.pollData, votes())}%`
      }
      bind:disabled={() => hasVoted()}
    >
      <div className="fill"></div>
      <span watch={state} bind:children>
        {props.option.desc} <div className="inline separator">|</div>{" "}
        {() => getPercent(state.value.pollData, votes())}%
      </span>
    </button>
  )
}
