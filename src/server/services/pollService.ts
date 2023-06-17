import { and, eq, sql, inArray } from "drizzle-orm"
import { db } from "../../db"
import { NewPoll, Poll, PollOption, pollOptions, pollVotes, polls } from "../../db/schema"
import { PollData } from "../../types/polls"

const pollVoteCounts = db
  .select({ optionId: pollVotes.optionId, count: sql<number>`count(*)` })
  .from(pollVotes)
  .groupBy(pollVotes.optionId)

export const pollService = {
  pageSize: 100,
  async getPage(page: number = 0): Promise<PollData[]> {
    const pollRows = await db
      .select()
      .from(polls)
      .where(eq(polls.disabled, false))
      .limit(this.pageSize)
      .offset(this.pageSize * page)

    const pollIds = pollRows.map((row) => row.id)

    const [optionRows, voteRows] = await Promise.all([
      db.select().from(pollOptions).where(inArray(pollOptions.pollId, pollIds)),
      pollVoteCounts.where(inArray(pollVotes.pollId, pollIds)),
    ])

    // now we want to aggregate the results to match the PollData type

    const _polls = pollRows
    const options = optionRows
    const voteCounts = voteRows.reduce<Record<number, number>>((acc, row) => {
      acc[row.optionId] = row.count
      return acc
    }, {})

    return _polls.map((poll) => {
      return {
        poll,
        options: options.filter((option) => option.pollId === poll.id),
        voteCounts,
      }
    })
  },

  async getById(id: number): Promise<PollData> {
    const [rows, votes] = await Promise.all([
      db
        .select()
        .from(polls)
        .where(and(eq(polls.id, id), eq(polls.disabled, false)))
        .rightJoin(pollOptions, eq(pollOptions.pollId, polls.id)),
      pollVoteCounts.where(eq(pollVotes.pollId, id)),
    ])

    const poll = rows[0].poll as Poll
    const options = rows.map((row) => row.poll_option as PollOption)
    const voteCounts = votes.reduce<Record<number, number>>((acc, row) => {
      acc[row.optionId] = row.count
      return acc
    }, {})
    return { poll, options, voteCounts }
  },

  async save(poll: NewPoll): Promise<Poll> {
    if (poll.id === 0 || !poll.id) {
      return (await db.insert(polls).values(poll).returning()).at(0) as Poll
    }
    return (await db.update(polls).set(poll).where(eq(polls.id, poll.id)).returning()).at(0) as Poll
  },
}
