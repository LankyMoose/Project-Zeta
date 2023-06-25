import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../Modal"
import { communityEditorModalOpen } from "../../state"
import { Button } from "../Button"
import { communityValidation } from "../../db/validation"

export const CommunityEditor = () => {
  const loading = createSignal(false)
  const state = createSignal({
    title: "",
    desc: "",
    private: false,
  })
  const saveCommunity = async (e: Event) => {
    e.preventDefault()
    console.log("Save community", state.value)
  }

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const value = target.type === "checkbox" ? target.checked : target.value
    // @ts-ignore
    state.value[target.id] = value
    state.notify()
  }

  return (
    <Modal
      visible={communityEditorModalOpen}
      toggle={() => (communityEditorModalOpen.value = false)}
    >
      <ModalHeader>Edit Community</ModalHeader>
      <ModalBody>
        <form onSubmit={saveCommunity}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              className="form-control"
              bind:value={() => state.value.title}
              oninput={handleChange}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button
          className="btn btn-secondary hover-animate"
          watch={loading}
          bind:disabled={() => loading.value}
          onclick={() => (communityEditorModalOpen.value = false)}
        >
          Cancel
        </Button>
        <Button
          watch={loading}
          bind:disabled={() =>
            loading.value ||
            !communityValidation.isCommunityValid(state.value.title, state.value.desc)
          }
          className="btn btn-primary hover-animate"
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  )
}
