import * as Cinnabun from "cinnabun"
import "./PollOptionButton.css"
import { vote } from "../../client/actions/polls"
import { addNotification } from "../Notifications"

export const PollOptionButton = (props: {
  id: string
  pollId: string
  desc: string
  votes: number
  hasVoted: boolean
  percent: number
  onVoted: (id: string) => void
}) => {
  const voteForOption = async (id: string) => {
    const res = await vote(props.pollId, id)
    if (res) {
      addNotification({
        text: "Voted!",
        type: "success",
      })
      return props.onVoted(id)
    }
    addNotification({
      text: "Failed to vote",
      type: "error",
    })
  }

  return (
    <button
      key={props.id}
      onclick={() => voteForOption(props.id.toString())}
      className={"poll-option" + (props.hasVoted ? " voted" : "")}
      style={`--percent: ${props.percent}%`}
    >
      <div className="fill"></div>
      <span>
        {props.desc} | {() => props.votes}
      </span>
    </button>
  )
}
