import * as Cinnabun from "cinnabun"
import { For, createSignal } from "cinnabun"
import { isCommunityOwner, selectedCommunity } from "../../state/community"
import { CommunityMemberData } from "../../../types/community"
import { Button } from "../../components/Button"
import { updateCommunityMemberType } from "../../../client/actions/communities"
import { addNotification } from "../../components/Notifications"

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
    if ("moderator" in res || "owner" in res) return

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
    if ("moderator" in res || "owner" in res) return
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
    if (!confirm("Are you sure you want to remove this member from the community?")) return
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

  const transferOwnership = async () => {
    if (!confirm("Are you sure you want to transfer ownership of this community?")) return
    loading.value = true
    const res = await updateCommunityMemberType(
      selectedCommunity.value!.id!,
      member.user.id,
      "owner"
    )
    if (!res) return
    if ("type" in res) return
    if ("owner" in res) {
      if (!selectedCommunity.value!.owners) selectedCommunity.value!.owners = []
      selectedCommunity.value!.owners[0] = res.owner

      selectedCommunity.value!.moderators = (selectedCommunity.value?.moderators ?? []).filter(
        (mod) => mod.user.id !== member.user.id
      )

      addNotification({
        type: "success",
        text: `${res.owner.user.name} is now a moderator`,
      })
    }
    if ("moderator" in res) {
      if (!selectedCommunity.value!.moderators) selectedCommunity.value!.moderators = []
      selectedCommunity.value!.moderators.push(res.moderator)
      selectedCommunity.value!.memberType = "moderator"
    }

    selectedCommunity.notify()

    loading.value = false
  }

  return (
    <div key={member.id} className="card">
      <div className="card-title flex gap justify-content-between align-items-center">
        <div className="avatar-wrapper sm">
          <img className="avatar" src={member.user.avatarUrl} alt={member.user.name} />
        </div>
        <span className="flex-grow">{member.user.name}</span>
        <div className="flex flex-wrap flex-column gap-sm">
          {member.memberType === "moderator" ? (
            <>
              <Button
                disabled={loading}
                className="btn btn-secondary hover-animate btn-sm"
                onclick={transferOwnership}
              >
                Transfer ownership
              </Button>
              <Button
                className="btn btn-danger hover-animate btn-sm"
                disabled={loading}
                onclick={demoteToMember}
              >
                Demote to member
              </Button>
            </>
          ) : isCommunityOwner() ? (
            <Button
              disabled={loading}
              className="btn btn-secondary hover-animate btn-sm"
              onclick={promoteToModerator}
            >
              Promote to moderator
            </Button>
          ) : (
            <></>
          )}
          <Button
            className="btn btn-danger hover-animate btn-sm"
            disabled={loading}
            onclick={revokeMembership}
          >
            Revoke membership
          </Button>
        </div>
      </div>
    </div>
  )
}

const MemberList = ({
  members,
  title,
}: {
  members: Cinnabun.Signal<CommunityMemberData[]>
  title: string
}) => {
  return (
    <section>
      <h3>{title}</h3>
      <For each={members} template={(member) => <MemberCard member={member} />} />
    </section>
  )
}

export const CommunityMemberManager = () => {
  const moderators = Cinnabun.computed(selectedCommunity, () => {
    return selectedCommunity.value?.moderators ?? []
  })
  const members = Cinnabun.computed(selectedCommunity, () => {
    return selectedCommunity.value?.members ?? []
  })

  return (
    <div watch={selectedCommunity} bind:children>
      {() => (isCommunityOwner() ? <MemberList title="Moderators" members={moderators} /> : <></>)}
      {() => <MemberList title="Members" members={members} />}
    </div>
  )
}
