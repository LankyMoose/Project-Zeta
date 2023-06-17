import { PollData } from "../../types/polls"

export const getPolls = async (page: number = 0): Promise<PollData[]> => {
  console.log("getPolls")
  try {
    const res = await $fetch(`/api/polls?page=${page}`)
    if (!res.ok) throw new Error("Failed to fetch polls")
    console.log("gotPolls")
    return await res.json()
  } catch (error) {
    console.error(error)
    throw new Error("Failed to fetch polls")
  }
}
export const getPoll = async (id: string): Promise<PollData> => {
  const res = await $fetch(`/api/polls/${id}`)
  if (!res.ok) throw new Error("Failed to fetch poll")
  return await res.json()
}

export const createPoll = async (poll: PollData): Promise<PollData> => {
  const res = await fetch(`/api/polls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(poll),
  })
  if (!res.ok) throw new Error("Failed to create poll")
  return await res.json()
}

export const updatePoll = async (poll: PollData): Promise<PollData> => {
  const res = await fetch(`/api/polls/${poll.poll.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(poll),
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

export const vote = async (pollId: string, optionId: string): Promise<void> => {
  const res = await fetch(`/api/polls/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optionId }),
  })
  if (!res.ok) throw new Error("Failed to vote")
}
