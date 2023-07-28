import * as Cinnabun from "cinnabun"
import { Cinnabun as cb, Suspense } from "cinnabun"
import { setPath } from "cinnabun/router"
import { pathStore, userStore } from "../../state"
import { MyCommunities } from "../../components/user/MyCommunities"
import { getUser } from "../../client/actions/users"
import { PublicUser } from "../../types/user"
import { DefaultLoader } from "../../components/loaders/Default"
import { addNotification } from "../../components/Notifications"

export default function UserPage({ params }: { params?: { userId?: string } }) {
  if (!params?.userId) return setPath(pathStore, "/users")

  if (!cb.isClient) return <></>

  const isSelfView = () => {
    return params.userId?.toLowerCase() === "me"
  }

  if (!userStore.value && isSelfView()) {
    addNotification({
      type: "error",
      text: "You must be logged in to view your profile.",
    })
    window.history.replaceState({}, "", "/")
    pathStore.value = "/"
    return
  }

  const loadUser = () => {
    if (isSelfView() && userStore.value)
      return Promise.resolve({
        user: userStore.value,
      })

    const id = isSelfView() ? userStore.value!.userId! : params.userId!
    console.log("loadUser", id)
    return getUser(id)
  }

  return (
    <>
      <Suspense promise={loadUser}>
        {(loading: boolean, data: { user?: PublicUser }) => {
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
