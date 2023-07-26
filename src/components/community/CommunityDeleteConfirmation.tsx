import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../modal/Modal"
import { communityDeleteModalOpen, communityHasMembers, selectedCommunity } from "../../state"
import { Button } from "../Button"

export const CommunityDeleteConfirmation = () => {
  const loading = createSignal(false)
  const confirmText = createSignal("")

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
          onclick={() => (communityDeleteModalOpen.value = false)}
        >
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  )
}
