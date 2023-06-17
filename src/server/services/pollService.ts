import { and, eq } from "drizzle-orm"
import { db } from "../../db"
import { NewPoll, Poll, polls } from "../../db/schema"

export const pollService = {
  pageSize: 100,
  async getPage(page: number = 0) {
    return await db
      .select()
      .from(polls)
      .where(eq(polls.disabled, false))
      .limit(this.pageSize)
      .offset(page * this.pageSize)
  },
  async getById(id: number) {
    return (
      await db
        .select()
        .from(polls)
        .where(and(eq(polls.id, id), eq(polls.disabled, false)))
        .limit(1)
    ).at(0)
  },
  async save(poll: NewPoll): Promise<Poll> {
    if (poll.id === 0 || !poll.id) {
      return (await db.insert(polls).values(poll).returning()).at(0) as Poll
    }
    return (await db.update(polls).set(poll).where(eq(polls.id, poll.id)).returning()).at(0) as Poll
  },
}
