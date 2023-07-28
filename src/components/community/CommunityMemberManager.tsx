import * as Cinnabun from "cinnabun"
import { For, createSignal } from "cinnabun"
import { isCommunityOwner, selectedCommunity } from "../../state/community"
import { CommunityMemberData } from "../../types/community"
import { Button } from "../Button"
import { updateCommunityMemberType } from "../../client/actions/communities"
import { addNotification } from "../Notifications"

const MemberCard = ({ member }: { member: CommunityMemberData }) => {
  const loading = createSignal(false)

  const demoteToMember = async () => {
    loading.value = true
    const res = await updateCommunityMemberType(
      selectedCommunity.value!.id!,
      member.user.id,
      "member"
    )
    loading.value = false

    if (!res) return
    if ("type" in res) return
    addNotification({
      type: "success",
      text: `${res.user.name} is now a member`,
    })

    selectedCommunity.value!.members = [...(selectedCommunity.value?.members ?? []), res]

    selectedCommunity.value!.moderators = (selectedCommunity.value?.moderators ?? []).filter(
      (mod) => mod.user.id !== res.user.id
    )

    selectedCommunity.notify()
  }

  const promoteToModerator = async () => {
    loading.value = true
    const res = await updateCommunityMemberType(
      selectedCommunity.value!.id!,
      member.user.id,
      "moderator"
    )
    loading.value = false
    if (!res) return
    if ("type" in res) return
    addNotification({
      type: "success",
      text: `${res.user.name} is now a moderator`,
    })

    selectedCommunity.value!.moderators = [...(selectedCommunity.value?.moderators ?? []), res]

    selectedCommunity.value!.members = (selectedCommunity.value?.members ?? []).filter(
      (member) => member.user.id !== res.user.id
    )

    selectedCommunity.notify()
  }

  const revokeMembership = async () => {
    loading.value = true
    const res = await updateCommunityMemberType(
      selectedCommunity.value!.id!,
      member.user.id,
      "none"
    )
    loading.value = false
    if (!res) return
    if ("type" in res && res.type === "removed") {
      addNotification({
        type: "success",
        text: `${member.user.name} has been removed from the community`,
      })

      selectedCommunity.value!.moderators = (selectedCommunity.value?.moderators ?? []).filter(
        (mod) => mod.user.id !== member.user.id
      )
      selectedCommunity.value!.members = (selectedCommunity.value?.members ?? []).filter(
        (member) => member.user.id !== member.user.id
      )
      selectedCommunity.notify()
    }
  }

  return (
    <div className="card">
      <div className="card-title flex gap justify-content-between">
        <span>{member.user.name}</span>
        <div className="flex flex-wrap flex-column gap-sm">
          {member.memberType === "moderator" ? (
            <Button
              className="btn btn-danger hover-animate btn-sm"
              watch={loading}
              bind:disabled={() => loading.value}
              onclick={demoteToMember}
            >
              Demote to member
            </Button>
          ) : (
            <Button className="btn btn-secondary hover-animate btn-sm" onclick={promoteToModerator}>
              Promote to moderator
            </Button>
          )}
          <Button
            className="btn btn-danger hover-animate btn-sm"
            watch={loading}
            bind:disabled={() => loading.value}
            onclick={revokeMembership}
          >
            Revoke membership
          </Button>
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
    <div watch={selectedCommunity} bind:children>
      {() =>
        isCommunityOwner() ? (
          <MemberList title="Moderators" members={selectedCommunity.value?.moderators ?? []} />
        ) : (
          <></>
        )
      }
      {() => <MemberList title="Members" members={selectedCommunity.value?.members ?? []} />}
    </div>
  )
}
