import { and, eq, sql } from "drizzle-orm"
import { db } from "../../db"
import {
  NewPoll,
  Poll,
  PollOption,
  pollOptions,
  pollVotes,
  polls,
} from "../../db/schema"
import { PollData } from "../../types/polls"
import postgres from "postgres"

const pollVoteCounts = (userId: number | null) =>
  db
    .select({
      optionId: pollVotes.optionId,
      count: sql<number>`count(*)`,
      hasVoted: sql<boolean>`bool_or(${pollVotes.userId} = ${userId})`,
    })
    .from(pollVotes)
    .groupBy(pollVotes.optionId)

const aggrigateVotes = (
  voteRows: { optionId: number; count: number; hasVoted: boolean }[]
) => {
  return voteRows.reduce<Record<number, { count: number; hasVoted: boolean }>>(
    (acc, row) => {
      acc[row.optionId] = {
        count: row.count,
        hasVoted: row.hasVoted,
      }
      return acc
    },
    {}
  )
}

export const pollService = {
  pageSize: 100,

  async getPage(
    page: number = 0,
    userId: number | null = null
  ): Promise<PollData[]> {
    const statement = sql`
      WITH P as (
        SELECT 
          ${polls.id},
          ${polls.disabled},
          ${polls.ownerId},
          ${polls.desc},
          ${polls.startedAt},
          ${polls.endedAt}

        FROM
          ${polls}
        WHERE
          ${polls.disabled} = false
        LIMIT
          ${this.pageSize}
        OFFSET
          ${this.pageSize * page}
      ),
      V as (
        select
          ${pollVotes.optionId},
          count(*) as count,
          bool_or(${pollVotes.userId} = ${userId}) as hasVoted
        from
          ${pollVotes}
        where
          ${pollVotes.pollId} in (select id from P)
        group by
          ${pollVotes.optionId}
      )
      
      SELECT
        P.*,
        ${pollOptions.id} as poll_option_id,
        ${pollOptions.desc} as poll_option_desc,
        V.option_id as poll_option_vote_optionId,
        V.count as poll_option_vote_count,
        V.hasVoted as poll_option_vote_hasVoted
      FROM
        P
      LEFT JOIN
        ${pollOptions} ON ${pollOptions.pollId} = P.id
      LEFT JOIN
        V ON V.option_id = ${pollOptions.id};

      `

    const res: postgres.RowList<Record<string, unknown>[]> = await db.execute(
      statement
    )

    // the query produces a result like this:
    // [{ "id": 1, "disabled": false, "owner_id": 1, "desc": "my first poll 😁", "started_at": "2023-06-16T00:00:00.000Z", "ended_at": null, "poll_option_id": 1, "poll_option_desc": "Option A", "poll_option_vote_optionid": 1, "poll_option_vote_count": "2", "poll_option_vote_hasvoted": true }, { "id": 1, "disabled": false, "owner_id": 1, "desc": "my first poll 😁", "started_at": "2023-06-16T00:00:00.000Z", "ended_at": null, "poll_option_id": 2, "poll_option_desc": "Option B", "poll_option_vote_optionid": null, "poll_option_vote_count": null, "poll_option_vote_hasvoted": null }]
    // we need to transform it into the PollData type
    // we can do this by grouping the rows by poll id
    // and then reducing the rows into a single object
    // for each poll
    const pollMap = res.reduce<Record<number, PollData>>((acc, row) => {
      const pollId = row.id as number
      if (!acc[pollId]) {
        acc[pollId] = {
          poll: {
            id: pollId,
            disabled: row.disabled as boolean,
            ownerId: row.owner_id as number,
            desc: row.desc as string,
            startedAt: row.started_at as string,
            endedAt: row.ended_at as string | null,
          },
          options: [],
          voteCounts: {},
        }
      }
      const poll = acc[pollId]
      if (row.poll_option_id) {
        poll.options.push({
          id: row.poll_option_id as number,
          desc: row.poll_option_desc as string,
          pollId: pollId,
        })
      }
      if (row.poll_option_vote_optionid) {
        poll.voteCounts[row.poll_option_vote_optionid as number] = {
          count: row.poll_option_vote_count as number,
          hasVoted: row.poll_option_vote_hasvoted as boolean,
        }
      }
      return acc
    }, {})
    return Object.values(pollMap)

    //return res

    // return pollRows.map((poll) => {
    //   return {
    //     poll,
    //     options: optionRows.filter((option) => option.pollId === poll.id),
    //     voteCounts: aggrigateVotes(voteRows),
    //   }
    // })
  },

  async getById(id: number, userId: number | null = null): Promise<PollData> {
    const [rows, votes] = await Promise.all([
      db
        .select()
        .from(polls)
        .where(and(eq(polls.id, id), eq(polls.disabled, false)))
        .rightJoin(pollOptions, eq(pollOptions.pollId, polls.id)),
      pollVoteCounts(userId).where(eq(pollVotes.pollId, id)),
    ])

    const poll = rows[0].poll as Poll
    return {
      poll,
      options: rows.map((row) => row.poll_option as PollOption),
      voteCounts: aggrigateVotes(votes),
    }
  },

  async save(poll: NewPoll): Promise<Poll> {
    if (poll.id === 0 || !poll.id) {
      return (await db.insert(polls).values(poll).returning()).at(0) as Poll
    }
    return (
      await db.update(polls).set(poll).where(eq(polls.id, poll.id)).returning()
    ).at(0) as Poll
  },
}
