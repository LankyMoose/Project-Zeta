import * as Cinnabun from "cinnabun"
import { Button } from "../Button"
import {
  communityDrawerOpen,
  communityDrawerState,
  pendingCommunityJoinRequests,
  selectedCommunity,
} from "../../state"
import { getCommunityJoinRequests } from "../../client/actions/communities"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { PendingJoinRequests } from "./PendingJoinRequests"
import { CommunityJoinRequestData } from "../../types/community"

const loadRequests = async () => {
  const res = selectedCommunity.value?.id
    ? await getCommunityJoinRequests(selectedCommunity.value.id)
    : []
  pendingCommunityJoinRequests.value = res ?? []
  return res
}

const handleClick = () => {
  communityDrawerState.value = {
    title: "Join Requests",
    componentFunc: PendingJoinRequests,
  }
  communityDrawerOpen.value = true
}

export const JoinRequestsButton = () => {
  return (
    <Cinnabun.Suspense promise={loadRequests}>
      {(loading: boolean, data?: CommunityJoinRequestData[]) => {
        if (loading)
          return (
            <Button disabled className="btn btn-primary hover-animate">
              Join Requests
              <EllipsisLoader />
            </Button>
          )
        console.log(data)
        return (
          <Button
            type="button"
            onclick={handleClick}
            disabled={!data || data.length === 0}
            className="btn btn-primary hover-animate"
          >
            Join Requests
            <span className="badge bg-light text-dark ml-2">{data ? data.length : 0}</span>
          </Button>
        )
      }}
    </Cinnabun.Suspense>
  )
}
