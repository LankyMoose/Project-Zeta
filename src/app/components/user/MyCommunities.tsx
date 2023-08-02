import * as Cinnabun from "cinnabun"
import { Suspense } from "cinnabun"
import { getMyCommunities } from "../../../client/actions/me"
import { CommunityListData, MyCommunitiesData } from "../../../types/community"
import { DefaultLoader } from "../loaders/Default"
import { CommunityList } from "../communities/CommunityList"

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
          if (loading) return <DefaultLoader />
          if (!data) return <></>
          return (
            <>
              <CommunityTypeList title="Joined" communities={data.member} />
              <CommunityTypeList title="Owned" communities={data.owned} />
              <CommunityTypeList title="Moderating" communities={data.moderated} />
            </>
          )
        }}
      </Suspense>
    </>
  )
}
