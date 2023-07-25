import * as Cinnabun from "cinnabun"
import { Button } from "../Button"
import { CommunityJoinRequest } from "../../db/schema"
import { selectedCommunity } from "../../state"
import { getCommunityJoinRequests } from "../../client/actions/communities"
import { EllipsisLoader } from "../loaders/Ellipsis"

const loadJoinRequests = async (): Promise<CommunityJoinRequest[] | void> => {
  if (!selectedCommunity.value || !selectedCommunity.value.id) return []
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
        console.log(data)
        return (
          <Button className="btn btn-primary hover-animate">
            Join Requests
            <span className="badge bg-light text-dark ml-2">{data ? data.length : 0}</span>
          </Button>
        )
      }}
    </Cinnabun.Suspense>
  )
}
