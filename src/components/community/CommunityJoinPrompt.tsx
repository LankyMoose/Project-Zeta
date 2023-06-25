import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Modal, ModalHeader, ModalBody } from "../Modal"
import { communityJoinModalOpen, selectedCommunity } from "../../state"
import { Button } from "../Button"
import { joinCommunity } from "../../client/actions/communities"
import { addNotification } from "../Notifications"
import { JoinResultType } from "../../types/community"
import { EllipsisLoader } from "../loaders/Ellipsis"

export const CommunityJoinPrompt = ({ communityUrlTitle }: { communityUrlTitle?: string }) => {
  const loading = createSignal(false)

  const join = async () => {
    const communityTitle = communityUrlTitle ?? selectedCommunity.value?.url_title
    if (!communityTitle) return addNotification({ type: "error", text: "No community selected." })
    loading.value = true
    const res = await joinCommunity(communityTitle)
    loading.value = false
    if (!res) return

    switch (res.type) {
      case JoinResultType.AlreadyJoined:
        addNotification({ type: "error", text: "You are already a member of this community." })
        break
      case JoinResultType.Error:
        addNotification({ type: "error", text: "An error occurred while joining the community." })
        break
      case JoinResultType.Success:
        addNotification({ type: "success", text: "You have joined the community." })
        break
      case JoinResultType.Pending:
        addNotification({
          type: "success",
          text: "You have requested to join the community. Sit tight!",
        })
        break
      default:
        break
    }
  }

  return (
    <Modal toggle={() => (communityJoinModalOpen.value = false)} visible={communityJoinModalOpen}>
      <ModalHeader>
        <h3>Join Community</h3>
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-column gap">
          <p className="text-muted m-0">
            <small>
              <i>Joining a community will allow you to post and comment.</i>
            </small>
          </p>
          <div className="flex gap justify-content-between">
            <Button
              watch={loading}
              bind:disabled={() => loading.value}
              onclick={() => (communityJoinModalOpen.value = false)}
              className="btn btn-secondary hover-animate"
            >
              Cancel
            </Button>
            <Button
              watch={loading}
              bind:disabled={() => loading.value}
              onclick={join}
              className="btn btn-primary hover-animate"
            >
              Join
              <EllipsisLoader watch={loading} bind:visible={() => loading.value} />
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}
