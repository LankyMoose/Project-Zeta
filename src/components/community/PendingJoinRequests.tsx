import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import { pendingCommunityJoinRequests } from "../../state"
import { CommunityJoinRequestData } from "../../types/community"

const JoinRequestCard = (joinReq: CommunityJoinRequestData) => {
  return (
    <div key={joinReq.id} className="card flex-row align-items-center">
      <div className="avatar-wrapper sm rounded-full border-none p-0 bg-primary-darkest">
        <img className="avatar" src={joinReq.user.avatarUrl} alt="avatar" />
      </div>
      {joinReq.user.name}
      <button type="button" className="btn btn-primary">
        Accept
      </button>
      <button type="button" className="btn btn-danger">
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
