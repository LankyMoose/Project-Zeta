import * as Cinnabun from "cinnabun"
import { Cinnabun as cb, Suspense } from "cinnabun"
import { setPath } from "cinnabun/router"
import { pathStore, userStore } from "../../state/global"
import { MyCommunities } from "../../components/user/MyCommunities"
import { getUser } from "../../client/actions/users"
import { PublicUser } from "../../types/user"
import { DefaultLoader } from "../../components/loaders/Default"
import { title } from "../../Document"

export default function UserPage({ params }: { params?: { userId?: string } }) {
  if (!params?.userId) return setPath(pathStore, "/users")

  if (!cb.isClient) return <></>

  const isSelfView = () => {
    return params.userId?.toLowerCase() === "me"
  }

  const handleMount = () => {
    if (!userStore.value && isSelfView()) setPath(pathStore, `/`)
  }

  const loadUser = async () => {
    if (isSelfView() && userStore.value) {
      title.value = `${userStore.value.name} | Project Zeta`
      return Promise.resolve({
        user: userStore.value,
      })
    } else if (isSelfView()) {
      return Promise.resolve({})
    }
    const res = await getUser(params.userId!)
    if (res) {
      title.value = `${res.name} | Project Zeta`
    }
    return Promise.resolve(res)
  }

  return (
    <div onMounted={handleMount}>
      <Suspense promise={loadUser}>
        {(loading: boolean, data?: PublicUser) => {
          if (loading) return <DefaultLoader />
          if (!data) return <></>

          return (
            <div className="page-title flex gap align-items-center">
              <div className="avatar-wrapper">
                <img src={data.picture} alt={data.name} className="avatar" width="48" height="48" />
              </div>
              <h1>{data.name}</h1>
            </div>
          )
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
