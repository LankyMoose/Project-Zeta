import * as Cinnabun from "cinnabun"
import { getCommunity } from "../../client/actions/communities"
import { Community } from "../../db/schema"
import { DefaultLoader } from "../../components/loaders/Default"
import { setPath } from "cinnabun/router"
import { pathStore } from "../../state"

export default function Communities({
  params,
}: {
  params?: { communityId?: string }
}) {
  if (!params?.communityId) return setPath(pathStore, "/communities")

  const loadCommunity = async (): Promise<Community | undefined> => {
    const res = await getCommunity(params.communityId!)
    if (!res) {
      setPath(pathStore, "/communities")
      return
    }
    return res
  }

  return (
    <Cinnabun.Suspense promise={loadCommunity} cache>
      {(loading: boolean, res: Community | undefined) => {
        if (loading) {
          return (
            <div className="page-body">
              <DefaultLoader />
            </div>
          )
        } else if (!res) {
          return (
            <div className="page-body">
              <div>Community not found 😢</div>
            </div>
          )
        }

        return (
          <>
            <div className="page-title flex-column">
              <h2>{res.title}</h2>
              <p>{res.description}</p>
            </div>
            <div className="page-body"></div>
          </>
        )
      }}
    </Cinnabun.Suspense>
  )
}
