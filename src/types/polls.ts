export type PollData = {
  poll: {
    webId: string
    disabled: boolean | null
    ownerId: number
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
