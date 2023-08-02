import * as Cinnabun from "cinnabun"
import { CommunityMemberData } from "../../../types/community"

export const CommunityMemberCard = ({ member }: { member: CommunityMemberData }) => {
  return (
    <div className="card flex flex-column" key={member.id}>
      <div className="flex justify-content-between gap align-items-start">
        <div className="avatar-wrapper sm">
          <img crossOrigim className="avatar" src={member.user.avatarUrl} alt={member.user.name} />
        </div>
        <h4 className="m-0 w-100 nowrap">{member.user.name}</h4>
        <small className="member-since text-muted">
          Since {new Date(member.createdAt).toLocaleString().split(",")[0]}
        </small>
      </div>
    </div>
  )
}
