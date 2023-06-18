export type PollData = {
  poll: {
    webId: string
    disabled: boolean | null
    ownerWebId: string
    desc: string
    startedAt: string
    endedAt: string | null
  }
  options: {
    id: number
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
