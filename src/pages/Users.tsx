import * as Cinnabun from "cinnabun"
import { DefaultLoader } from "../components/loaders/Default"
import { title } from "../Document"
import { getUsers } from "../client/actions/users"
import { User } from "../db/schema"
import { UserList } from "../components/users/UserList"

export default function Users() {
  title.value = "Users | Project Zeta"

  return (
    <>
      <div className="page-title flex align-items-center justify-content-between gap flex-wrap">
        <h1>Users</h1>
      </div>
      <div className="page-body">
        <Cinnabun.Suspense promise={getUsers} cache>
          {(loading: boolean, users: User[] | undefined) => {
            if (loading) return <DefaultLoader />
            if (!users)
              return (
                <div>
                  <span className="text-danger">Oops! Something went wrong 😢</span>
                </div>
              )
            if (users.length === 0)
              return (
                <div>
                  <span className="text-muted">There are no users... Is this the end?</span>
                </div>
              )

            return <UserList users={users} />
          }}
        </Cinnabun.Suspense>
      </div>
    </>
  )
}
