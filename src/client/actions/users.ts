import { User } from "../../db/schema"

export type UserListResponse = { users: User[] }
export const getUsers = async (page: number = 0): Promise<UserListResponse> => {
  const res = await $fetch(`/api/users?page=${page}`)
  if (!res.ok) throw new Error("Failed to fetch users")
  return await res.json()
}

export const getUser = async (id: string): Promise<User> => {
  const res = await $fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error("Failed to fetch user")
  return await res.json()
}
