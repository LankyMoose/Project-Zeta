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

const loadRequests = async () => {
  const res = !!selectedCommunity.value?.id
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

export const PendingJoinRequestsButton = () => {
  return (
    <Cinnabun.Suspense promise={loadRequests}>
      {(loading: boolean) => {
        if (loading)
          return (
            <Button disabled className="btn btn-primary hover-animate">
              Join Requests
              <EllipsisLoader />
            </Button>
          )
        return (
          <Button
            type="button"
            onclick={handleClick}
            disabled={pendingCommunityJoinRequests.value.length === 0}
            className="btn btn-primary hover-animate"
          >
            Join Requests
            <span
              watch={pendingCommunityJoinRequests}
              bind:children
              className="badge bg-light text-dark ml-2"
            >
              {() => pendingCommunityJoinRequests.value.length}
            </span>
          </Button>
        )
      }}
    </Cinnabun.Suspense>
  )
}
