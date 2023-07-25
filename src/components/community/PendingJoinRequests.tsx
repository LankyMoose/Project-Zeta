import * as Cinnabun from "cinnabun"
import { For, createSignal } from "cinnabun"
import { communityDrawerOpen, pendingCommunityJoinRequests } from "../../state"
import { CommunityJoinRequestData } from "../../types/community"
import { respondToCommunityJoinRequest } from "../../client/actions/communities"
import { addNotification } from "../Notifications"

const JoinRequestCard = (joinReq: CommunityJoinRequestData) => {
  const { id, communityId } = joinReq

  const loading = createSignal(false)

  const respondToRequest = async (communityId: string, joinRequestId: string, accept: boolean) => {
    loading.value = true
    const res = await respondToCommunityJoinRequest(communityId, joinRequestId, accept)
    if (!res) {
      loading.value = false
      return
    }
    const idx = pendingCommunityJoinRequests.value.findIndex((j) => j.id === joinRequestId)
    pendingCommunityJoinRequests.value.splice(idx, 1)
    pendingCommunityJoinRequests.notify()
    loading.value = false
    addNotification({
      text: `You ${accept ? "accepted" : "rejected"} ${joinReq.user.name}'s join request`,
      type: "success",
    })
    // if (selectedCommunity.value?.members) {
    //   selectedCommunity.value.members.push({
    //     id: res.id,
    //     name: res.name,
    //     avatarUrl: res.avatarUrl,
    //   })
    //   selectedCommunity.notify()
    // }
    if (pendingCommunityJoinRequests.value.length === 0) {
      communityDrawerOpen.value = false
    }
  }

  return (
    <div key={id} className="card flex-row align-items-center">
      <div className="avatar-wrapper sm rounded-full border-none p-0 bg-primary-darkest">
        <img className="avatar" src={joinReq.user.avatarUrl} alt="avatar" />
      </div>
      <small>{joinReq.user.name}</small>
      <button
        type="button"
        className="btn btn-primary"
        watch={loading}
        bind:disabled={() => loading.value}
        onclick={() => respondToRequest(communityId, id, true)}
      >
        Accept
      </button>
      <button
        type="button"
        className="btn btn-danger"
        watch={loading}
        bind:disabled={() => loading.value}
        onclick={() => respondToRequest(communityId, id, false)}
      >
        Reject
      </button>
    </div>
  )
}

export const PendingJoinRequests = () => {
  return (
    <div>
      <For each={pendingCommunityJoinRequests} template={JoinRequestCard} />
    </div>
  )
}
