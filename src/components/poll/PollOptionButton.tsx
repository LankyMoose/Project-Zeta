import * as Cinnabun from "cinnabun"
import "./PollOptionButton.css"

export const PollOptionButton = (props: {
  id: number
  desc: string
  voteCounts: { count: number; hasVoted: boolean } | undefined
  percent: number
}) => {
  return (
    <button
      key={props.id}
      onclick={() => console.log(props.id)}
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
