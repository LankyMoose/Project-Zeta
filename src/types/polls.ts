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
  voteCounts: {
    [optionId: string]: {
      count: number
      hasVoted: boolean
    }
  }
}

export type NewPoll = {
  desc: string
  options: string[]
}
