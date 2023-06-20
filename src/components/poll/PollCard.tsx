import * as Cinnabun from "cinnabun"
import { PollData } from "../../types/polls"
import { PollOptionButton } from "./PollOptionButton"
import { getTotalVotes } from "./utils"
//import { userStore } from "../../state"

export const PollCard = (props: PollData) => {
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
          template={(option) => (
            <PollOptionButton option={option} pollData={props} />
          )}
        />
      </div>
      <div>
        <span className="text-muted">
          Total votes: {() => getTotalVotes(props)}
        </span>
      </div>
    </div>
  )
}
