import * as Cinnabun from "cinnabun"
import { PollData } from "../../types/polls"
import { PollOptionButton } from "./PollOptionButton"
//import { userStore } from "../../state"

export const PollCard = (props: PollData) => {
  const totalVotes = props.options.reduce((acc, option) => {
    return acc + (props.voteCounts[option.id]?.count || 0)
  }, 0)
  const titleText = props.poll.desc
  const titleClass =
    "card-title " +
    (titleText.length > 128
      ? "x-small"
      : titleText.length > 64
      ? "small"
      : "large")
  return (
    <div key={props.poll.id} className="card">
      <h3 className={titleClass}>{titleText}</h3>
      <div style="display:flex; flex-direction:column; gap:1rem">
        <Cinnabun.For
          each={props.options}
          template={(option) => {
            return (
              <PollOptionButton
                {...option}
                pollId={props.poll.id}
                voteCounts={props.voteCounts[option.id]}
                percent={
                  !props.voteCounts[option.id]
                    ? 0
                    : (props.voteCounts[option.id].count / totalVotes) * 1000
                }
              />
            )
          }}
        />
      </div>
    </div>
  )
}
