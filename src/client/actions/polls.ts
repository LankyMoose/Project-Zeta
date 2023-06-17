import { Poll } from "../../db/schema"

export type PollListResponse = { polls: Poll[] }
export const getPolls = async (page: number = 0): Promise<PollListResponse> => {
  const res = await fetch(`/api/polls?page=${page}`)
  if (!res.ok) throw new Error("Failed to fetch polls")
  return await res.json()
}
