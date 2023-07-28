import * as Cinnabun from "cinnabun"
import { Cinnabun as cb, Suspense } from "cinnabun"
import { setPath } from "cinnabun/router"
import { pathStore, userStore } from "../../state/global"
import { MyCommunities } from "../../components/user/MyCommunities"
import { getUser } from "../../client/actions/users"
import { PublicUser } from "../../types/user"
import { DefaultLoader } from "../../components/loaders/Default"

export default function UserPage({ params }: { params?: { userId?: string } }) {
  if (!params?.userId) return setPath(pathStore, "/users")

  if (!cb.isClient) return <></>

  const isSelfView = () => {
    return params.userId?.toLowerCase() === "me"
  }

  const handleMount = () => {
    if (!userStore.value && isSelfView()) setPath(pathStore, `/`)
  }

  const loadUser = () => {
    if (isSelfView() && userStore.value) {
      return Promise.resolve({
        user: userStore.value,
      })
    } else if (isSelfView()) {
      return Promise.resolve({})
    }
    return getUser(params.userId!)
  }

  return (
    <div onMounted={handleMount}>
      <Suspense promise={loadUser}>
        {(loading: boolean, data?: { user?: PublicUser }) => {
          if (loading) return <DefaultLoader />
          if (!data?.user) return <></>
          return <h1>{data?.user.name}</h1>
        }}
      </Suspense>
      <div
        watch={userStore}
        bind:visible={() => !cb.isClient || params?.userId?.toLowerCase() === "me"}
      >
        <MyCommunities />
      </div>
    </div>
  )
}
