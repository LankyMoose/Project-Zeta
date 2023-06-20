import { PollVote } from "../../db/schema"
import { PollData } from "../../types/polls"

export const getPolls = async (page: number = 0): Promise<PollData[]> => {
  try {
    const res = await fetch(`/api/polls?page=${page}`)
    if (!res.ok) throw new Error("Failed to fetch polls")
    return await res.json()
  } catch (error) {
    console.error(error)
    throw new Error("Failed to fetch polls")
  }
}
export const getPoll = async (id: string): Promise<PollData> => {
  const res = await fetch(`/api/polls/${id}`)
  if (!res.ok) throw new Error("Failed to fetch poll")
  return await res.json()
}

export const createPoll = async (poll: {
  id?: string
  desc: string
  options: string[]
}): Promise<PollData> => {
  const res = await fetch(`/api/polls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(poll),
  })
  if (!res.ok) throw new Error("Failed to create poll")
  return await res.json()
}

export const updatePoll = async (
  pollData: PollData
): Promise<{ id: string; desc: string; options: string[] }> => {
  const res = await fetch(`/api/polls/${pollData.poll.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pollData),
  })
  if (!res.ok) throw new Error("Failed to update poll")
  return await res.json()
}

export const deletePoll = async (id: string): Promise<void> => {
  const res = await fetch(`/api/polls/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete poll")
}
///api/polls/:id/vote/:optionId
export const vote = async (
  pollId: string,
  optionId: string
): Promise<PollVote | null> => {
  const res = await fetch(`/api/polls/${pollId}/vote/${optionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error("Failed to vote")

  return await res.json()
}
