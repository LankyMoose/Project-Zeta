import { PollData } from "../../types/polls"

export const getTotalVotes = (pollData: PollData) => {
  let totalVotes = 0
  for (const option of pollData.options) {
    totalVotes += parseInt(
      pollData.voteCounts[option.id]?.count.toString() || "0"
    )
  }
  return totalVotes
}
