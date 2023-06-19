import * as Cinnabun from "cinnabun"
import "./PollOptionButton.css"
import { vote } from "../../client/actions/polls"

export const PollOptionButton = (props: {
  id: string
  pollId: string
  desc: string
  voteCounts: { count: number; hasVoted: boolean } | undefined
  percent: number
}) => {
  const voteForOption = async (id: string) => {
    await vote(props.pollId, id)
  }

  return (
    <button
      key={props.id}
      onclick={() => voteForOption(props.id.toString())}
      className={
        "poll-option" +
        (props.voteCounts && props.voteCounts.hasVoted ? " voted" : "")
      }
      style={`--percent: ${props.percent}%`}
    >
      <div className="fill"></div>
      <span>
        {props.desc} | {props.voteCounts?.count || 0}
      </span>
    </button>
  )
}
