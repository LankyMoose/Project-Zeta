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
    const polls = cb.getRuntimeService(LiveSocket).polls
    const pollData = polls.value.find(
      (pollData) => pollData.poll.id === props.pollData.poll.id
    )!
    // perform optimistic update
    let prevVoteId: string | undefined = undefined
    if (pollData.loading) return
    pollData.loading = true
    let matched = false
    for (const [k, v] of Object.entries(pollData.voteCounts)) {
      if (k === id) {
        matched = true
        if (v.hasVoted) return
        v.count++
        v.hasVoted = true
      } else if (v.hasVoted) {
        prevVoteId = k
        v.hasVoted = false
        v.count--
      }
    }
    if (!matched) {
      pollData.voteCounts[id] = {
        count: 1,
        hasVoted: true,
      }
    }
    polls.notify()
    const res = await vote(props.pollData.poll.id, id)
    pollData.loading = false
    if (!res) {
      // revert optimistic update
      for (const [k, v] of Object.entries(pollData.voteCounts)) {
        if (k === id) {
          v.count--
          v.hasVoted = false
        }
      }
      if (prevVoteId) {
        if (pollData.voteCounts[prevVoteId]) {
          pollData.voteCounts[prevVoteId].count++
          pollData.voteCounts[prevVoteId].hasVoted = true
        } else {
          pollData.voteCounts[prevVoteId] = {
            count: 1,
            hasVoted: true,
          }
        }
      }
      polls.notify()
      addNotification({
        text: "Failed to vote",
        type: "error",
      })
    }
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
        {() => getPercent(state.value.pollData, votes()).toFixed(1)}%
      </span>
    </button>
  )
}
