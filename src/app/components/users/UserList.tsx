import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import { User } from "../../../db/schema"
import { UserListCard } from "./UserListCard"

export const UserList = ({ users }: { users: User[] }) => {
  return (
    <ul className="card-list w-100">
      <For each={users} template={(user) => <UserListCard user={user} />} />
    </ul>
  )
}
