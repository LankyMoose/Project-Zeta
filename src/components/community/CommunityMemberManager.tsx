import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import { isCommunityAdmin, selectedCommunity } from "../../state/community"
import { CommunityMemberData } from "../../types/community"
import { Button } from "../Button"

const MemberCard = ({ member }: { member: CommunityMemberData }) => {
  return (
    <div className="card">
      <div className="card-title flex gap justify-content-between">
        <span>{member.user.name}</span>
        <div className="flex flex-wrap flex-column gap-sm">
          {member.memberType === "moderator" ? (
            <Button className="btn btn-danger hover-animate btn-sm">Demote to member</Button>
          ) : (
            <Button className="btn btn-secondary hover-animate btn-sm">Promote to moderator</Button>
          )}
        </div>
      </div>
    </div>
  )
}

const MemberList = ({ members, title }: { members: CommunityMemberData[]; title: string }) => {
  return (
    <section>
      <h3>{title}</h3>
      <For each={members} template={(member) => <MemberCard member={member} />} />
    </section>
  )
}

export const CommunityMemberManager = () => {
  return (
    <>
      {isCommunityAdmin() ? (
        <MemberList title="Moderators" members={selectedCommunity.value?.moderators ?? []} />
      ) : (
        <></>
      )}
      <MemberList title="Members" members={selectedCommunity.value?.members ?? []} />
    </>
  )
}
