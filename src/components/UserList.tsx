import * as Cinnabun from "cinnabun"
import { Suspense, For } from "cinnabun"
import { UserListResponse, getUsers } from "../client/actions/users"

export const UserList = () => {
  return (
    <Suspense promise={getUsers} cache>
      {(loading: boolean, data: UserListResponse) => {
        if (loading) return <div>Loading...</div>
        console.log(data)
        return (
          data && (
            <ul>
              <For each={data.users} template={(user) => <li key={user.id}>{user.name}</li>} />
            </ul>
          )
        )
      }}
    </Suspense>
  )
}
