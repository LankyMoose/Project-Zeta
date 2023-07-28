import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../modal/Modal"
import { pathStore } from "../../state/global"
import {
  selectedCommunity,
  communityDeleteModalOpen,
  communityHasMembers,
} from "../../state/community"
import { Button } from "../Button"
import { deleteCommunity } from "../../client/actions/communities"
import { addNotification } from "../Notifications"
import { setPath } from "cinnabun/router"
import { EllipsisLoader } from "../loaders/Ellipsis"

export const CommunityDeleteConfirmation = () => {
  const loading = createSignal(false)
  const confirmText = createSignal("")

  const handleDelete = async () => {
    if (confirmText.value !== selectedCommunity.value!.title) {
      addNotification({
        text: "Confirmation text does not match!",
        type: "error",
      })
      return
    }
    if (!selectedCommunity.value?.id) {
      addNotification({
        text: "No community selected!",
        type: "error",
      })
      return
    }
    loading.value = true
    const res = await deleteCommunity(selectedCommunity.value?.id)
    communityDeleteModalOpen.value = false
    setPath(pathStore, "/communities")
    loading.value = false
    if (!res) return

    addNotification({
      text: "Community deleted.",
      type: "success",
    })
  }

  return (
    <Modal
      visible={communityDeleteModalOpen}
      toggle={() => (communityDeleteModalOpen.value = false)}
    >
      <ModalHeader>
        <h2>Delete Community</h2>
      </ModalHeader>
      <ModalBody watch={selectedCommunity} bind:children>
        {() =>
          communityHasMembers() ? (
            <>
              <i>This community has members. Consider transferring ownership instead!</i>
            </>
          ) : (
            <></>
          )
        }
        <p>
          <small>
            Are you really sure you want to delete this community and everything within it?{" "}
            <b>This can't be undone!</b>
          </small>
        </p>

        <small>
          Type <b>{() => selectedCommunity.value?.title}</b> to confirm.
        </small>
        <input
          type="text"
          className="form-control"
          watch={confirmText}
          bind:value={() => confirmText.value}
          oninput={(e: InputEvent) => (confirmText.value = (e.target as HTMLInputElement).value)}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          watch={loading}
          bind:disabled={() => loading.value}
          className="btn btn-secondary hover-animate"
          onclick={() => (communityDeleteModalOpen.value = false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          watch={[confirmText, loading]}
          bind:disabled={() =>
            confirmText.value !== selectedCommunity.value?.title || loading.value
          }
          className="btn btn-danger hover-animate"
          onclick={handleDelete}
        >
          Delete
          <EllipsisLoader watch={loading} bind:visible={() => loading.value} />
        </Button>
      </ModalFooter>
    </Modal>
  )
}
