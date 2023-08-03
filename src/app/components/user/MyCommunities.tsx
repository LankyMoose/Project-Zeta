import * as Cinnabun from "cinnabun"
import { Suspense } from "cinnabun"
import { getMyCommunities } from "../../../client/actions/me"
import { CommunityListData, MyCommunitiesData } from "../../../types/community"
import { CommunityList } from "../communities/CommunityList"
import { SkeletonList } from "../loaders/SkeletonList"
import { SkeletonElement } from "../loaders/SkeletonElement"

const CommunityTypeList = ({
  title,
  communities,
}: {
  title: string
  communities: CommunityListData[]
}) => {
  return (
    <section>
      <h3>{title}</h3>
      <CommunityList communities={communities} />
    </section>
  )
}

export const MyCommunities = () => {
  return (
    <>
      <h2>My Communities</h2>
      <Suspense promise={getMyCommunities} cache>
        {(loading: boolean, data?: MyCommunitiesData) => {
          if (loading)
            return (
              <>
                <div className="flex gap flex-column mb-3">
                  <SkeletonElement tag="h4" style="width:100px; min-height:32px; margin:0" />
                  <SkeletonList numberOfItems={1} />
                </div>
                <div className="flex gap flex-column">
                  <SkeletonElement tag="h4" style="width:100px; min-height:32px; margin:0" />
                  <SkeletonList numberOfItems={2} />
                </div>
              </>
            )

          if (!data) return <></>
          return (
            <>
              {data.owned.length === 0 ? (
                <></>
              ) : (
                <CommunityTypeList title="Owned" communities={data.owned} />
              )}

              {data.moderated.length === 0 ? (
                <></>
              ) : (
                <CommunityTypeList title="Moderating" communities={data.moderated} />
              )}

              {data.member.length === 0 ? (
                <></>
              ) : (
                <CommunityTypeList title="Joined" communities={data.member} />
              )}
            </>
          )
        }}
      </Suspense>
    </>
  )
}
