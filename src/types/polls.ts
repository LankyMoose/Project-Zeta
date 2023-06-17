export type PollData = {
  poll: {
    id: number
    disabled: boolean | null
    ownerId: number
    desc: string
    startedAt: string
    endedAt: string | null
  }
  options: {
    id: number
    desc: string
    pollId: number
  }[]
  voteCounts: {
    [optionId: string]: {
      count: number
      hasVoted: boolean
    }
  }
}
