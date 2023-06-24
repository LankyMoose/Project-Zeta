import * as Cinnabun from "cinnabun"
import { getCommunities } from "../client/actions/communities"
import { Community } from "../db/schema"
import { CommunityList } from "../components/communities/CommunityList"
import { CreateCommunity } from "../components/communities/CreateCommunity"

export default function Communities() {
  return (
    <>
      <div className="page-title">
        <h2>Communities</h2>
        <CreateCommunity />
      </div>
      <Cinnabun.Suspense promise={getCommunities} cache>
        {(loading: boolean, res: Community[] | undefined) => {
          if (loading) return <div>Loading...</div>

          return <CommunityList communities={res ?? []} />
        }}
      </Cinnabun.Suspense>
    </>
  )
}
