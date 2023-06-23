export type PollVoteCountData = {
  count: number
  hasVoted: boolean
}
export type PollVoteCounts = {
  [optionId: string]: PollVoteCountData
}
export type AnonPollVoteCounts = {
  [optionId: string]: Omit<PollVoteCountData, "hasVoted">
}

export type PollData = {
  poll: {
    id: string
    disabled: boolean | null
    ownerId: string
    desc: string
    startedAt: Date | string
    endedAt: Date | string | null
  }
  options: {
    id: string
    desc: string
  }[]
  voteCounts: PollVoteCounts
}

export type NewPoll = {
  desc: string
  options: string[]
}
