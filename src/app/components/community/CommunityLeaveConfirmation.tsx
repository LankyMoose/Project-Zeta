import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../modal/Modal"
import { Button } from "../../components/Button"
import { addNotification } from "../notifications/Notifications"
import { leaveCommunity } from "../../../client/actions/communities"
import { LeaveResultType } from "../../../types/community"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { selectedCommunity, communityLeaveModalOpen } from "../../state/community"
import { pathStore } from "../../state/global"

export const CommunityLeaveConfirmation = () => {
  const loading = createSignal(false)

  const reloadCommmunity = () => {
    const communityTitle = selectedCommunity.value?.url_title
    window.history.pushState({}, "", `/communities/${communityTitle}`)
    pathStore.value = `/communities/${communityTitle}`
    communityLeaveModalOpen.value = false
  }

  const leave = async () => {
    const communityId = selectedCommunity.value?.id
    if (!communityId) return addNotification({ type: "error", text: "No community selected." })
    loading.value = true
    const res = await leaveCommunity(communityId)
    loading.value = false
    if (!res) return

    switch (res.type) {
      case LeaveResultType.Success:
        addNotification({ type: "success", text: "You have left the community." })
        break
      case LeaveResultType.Error:
        addNotification({ type: "error", text: "An error occurred while leaving the community." })
        break
      case LeaveResultType.NotAMember:
        addNotification({ type: "error", text: "You're already not a member of the community." })
        break
      default:
        console.error("Unhandled leave result type:", res.type)
        break
    }
    reloadCommmunity()
  }

  return (
    <Modal toggle={() => (communityLeaveModalOpen.value = false)} visible={communityLeaveModalOpen}>
      <ModalHeader>
        <h2>Leave Community</h2>
      </ModalHeader>
      <ModalBody>
        <p>Are you really sure you want to leave this community?</p>
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          className="btn btn-secondary hover-animate"
          watch={loading}
          bind:disabled={() => loading.value}
          onclick={() => (communityLeaveModalOpen.value = false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="btn btn-danger hover-animate"
          watch={loading}
          bind:disabled={() => loading.value}
          onclick={leave}
        >
          Leave
          <EllipsisLoader watch={loading} bind:visible={() => loading.value} />
        </Button>
      </ModalFooter>
    </Modal>
  )
}
