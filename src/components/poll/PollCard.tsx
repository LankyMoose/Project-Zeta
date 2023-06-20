import * as Cinnabun from "cinnabun"
import { PollData } from "../../types/polls"
import { PollOptionButton } from "./PollOptionButton"
//import { userStore } from "../../state"

export const PollCard = (props: PollData) => {
  let totalVotes = 0
  for (const option of props.options) {
    totalVotes += parseInt(props.voteCounts[option.id]?.count.toString() || "0")
  }

  const options = Cinnabun.createSignal(
    props.options.map((option) => {
      return {
        ...option,
        votes: props.voteCounts[option.id]?.count || 0,
        hasVoted: props.voteCounts[option.id]?.hasVoted || false,
      }
    })
  )

  const onVoted = (id: string) => {
    for (const option of options.value) {
      if (option.id === id) {
        option.hasVoted = true
        option.votes =
          parseInt(props.voteCounts[option.id]?.count.toString() || "0") + 1
      } else {
        if (option.hasVoted) {
          option.votes =
            parseInt(props.voteCounts[option.id]?.count.toString() || "0") - 1
        }
        option.hasVoted = false
      }
    }
    options.notify()
  }

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
          each={options}
          template={(option) => {
            const percent = !props.voteCounts[option.id]
              ? 0
              : (props.voteCounts[option.id].count / totalVotes) * 100
            return (
              <PollOptionButton
                {...option}
                pollId={props.poll.id}
                percent={percent}
                onVoted={onVoted}
              />
            )
          }}
        />
      </div>
    </div>
  )
}
