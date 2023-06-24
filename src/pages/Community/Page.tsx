import * as Cinnabun from "cinnabun"
import { getCommunity } from "../../client/actions/communities"
import { Community } from "../../db/schema"

export default function Communities({
  params,
}: {
  params?: { communityId?: string }
}) {
  const loadCommunity = async () => {
    if (!params?.communityId) return (window.location.href = "/communities")
    return await getCommunity(params.communityId)
  }

  return (
    <Cinnabun.Suspense promise={loadCommunity} cache>
      {(loading: boolean, res: Community | undefined) => {
        if (loading) return <div>Loading...</div>

        if (!res) return <div>Community not found 😢</div>

        return (
          <div>
            <h2>{res.title}</h2>
            <p>{res.description}</p>
          </div>
        )
      }}
    </Cinnabun.Suspense>
  )
}
