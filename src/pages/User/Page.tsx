import * as Cinnabun from "cinnabun"
import { Cinnabun as cb, Suspense } from "cinnabun"
import { setPath } from "cinnabun/router"
import { pathStore, userStore } from "../../state"
import { MyCommunities } from "../../components/user/MyCommunities"
import { getUser } from "../../client/actions/users"
import { PublicUser } from "../../types/user"
import { DefaultLoader } from "../../components/loaders/Default"

export default function UserPage({ params }: { params?: { userId?: string } }) {
  if (!params?.userId) return setPath(pathStore, "/users")

  const isOwnProfile = () => {
    return params.userId?.toLowerCase() === "me"
  }

  if (cb.isClient && !userStore.value?.userId && isOwnProfile()) {
    return setPath(pathStore, "/users")
  }

  const loadUser = () => {
    if (isOwnProfile() && userStore.value)
      return Promise.resolve({
        user: userStore.value,
      })

    return getUser(isOwnProfile() ? userStore.value!.userId! : params.userId!)
  }

  return (
    <>
      <Suspense promise={loadUser}>
        {(loading: boolean, data: { user?: PublicUser }) => {
          console.log(data)
          if (loading) return <DefaultLoader />
          if (!data?.user) return <></>
          return <h1>{data?.user.name}</h1>
        }}
      </Suspense>
      <div watch={userStore} bind:visible={() => params?.userId?.toLowerCase() === "me"}>
        <MyCommunities />
      </div>
    </>
  )
}
