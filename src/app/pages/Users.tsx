import * as Cinnabun from "cinnabun"
import { title } from "../Document"
import { getUsers } from "../../client/actions/users"
import { User } from "../../db/schema"
import { UserList } from "../components/users/UserList"
import { SkeletonList } from "../components/loaders/SkeletonList"
import { PageTitle } from "../components/PageTitle"
import { PageBody } from "../components/PageBody"

export default function Users() {
  title.value = "Users | Project Zeta"

  return (
    <>
      <PageTitle>
        <h1>Users</h1>
      </PageTitle>
      <PageBody>
        <Cinnabun.Suspense promise={getUsers} cache>
          {(loading: boolean, users: User[] | undefined) => {
            if (loading) return <SkeletonList numberOfItems={3} className="card-list" />
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
      </PageBody>
    </>
  )
}
