import * as Cinnabun from "cinnabun"
import { Suspense } from "cinnabun"
import { getMyCommunities } from "../../client/actions/me"
import { CommunityListData, MyCommunitiesData } from "../../types/community"
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
      <h2>{title}</h2>
      <CommunityList communities={communities} />
    </section>
  )
}

export const MyCommunities = () => {
  return (
    <>
      <h1>My Communities</h1>
      <Suspense promise={getMyCommunities}>
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
