import { API_URL } from "../../constants"
import { User } from "../../db/schema"

export const getUsers = async (page: number = 0): Promise<User[] | void> => {
  try {
    const res = await fetch(`${API_URL}/users?page=${page}`)
    if (!res.ok) throw new Error("Failed to fetch users")
    return await res.json()
  } catch (error) {
    console.error(error)
  }
}

export const getUser = async (id: string): Promise<User | void> => {
  try {
    const res = await fetch(`${API_URL}/users/${id}`)
    if (!res.ok) throw new Error("Failed to fetch user")
    return await res.json()
  } catch (error) {
    console.error(error)
  }
}
