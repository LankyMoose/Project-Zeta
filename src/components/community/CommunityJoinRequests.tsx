import * as Cinnabun from "cinnabun"
import { Button } from "../Button"
import { CommunityJoinRequest } from "../../db/schema"
import { selectedCommunity } from "../../state"
import { getCommunityJoinRequests } from "../../client/actions/communities"
import { EllipsisLoader } from "../loaders/Ellipsis"

const loadJoinRequests = async (): Promise<CommunityJoinRequest[] | void> => {
  if (!selectedCommunity.value || !selectedCommunity.value.id) return []
  console.log("loading join requests", selectedCommunity.value)
  return await getCommunityJoinRequests(selectedCommunity.value!.id)
}

export const CommunityJoinRequests = () => {
  return (
    <Cinnabun.Suspense promise={loadJoinRequests}>
      {(loading: boolean, data?: CommunityJoinRequest[]) => {
        if (loading)
          return (
            <Button disabled className="btn btn-primary hover-animate">
              Join Requests
              <EllipsisLoader />
            </Button>
          )
        if (!data || !data.length) return <></>
        return (
          <Button className="btn btn-primary hover-animate">
            Join Requests
            <span className="badge bg-light text-dark ml-2">{data.length}</span>
          </Button>
        )
      }}
    </Cinnabun.Suspense>
  )
}
