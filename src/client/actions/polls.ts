import { Poll } from "../../db/schema"

export type PollListResponse = { polls: Poll[] }
export const getPolls = async (page: number = 0): Promise<PollListResponse> => {
  const res = await fetch(`/api/polls?page=${page}`)
  if (!res.ok) throw new Error("Failed to fetch polls")
  return await res.json()
}
export const getPoll = async (id: string): Promise<Poll> => {
  const res = await fetch(`/api/polls/${id}`)
  if (!res.ok) throw new Error("Failed to fetch poll")
  return await res.json()
}
