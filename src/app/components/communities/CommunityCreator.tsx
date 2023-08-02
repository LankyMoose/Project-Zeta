import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Button } from "../../components/Button"
import { Modal, ModalBody, ModalHeader } from "../modal/Modal"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { createCommunity } from "../../../client/actions/communities"
import { pathStore } from "../../state/global"
import { communityValidation } from "../../../db/validation"
import { setPath } from "cinnabun/router"
import { communityCreatorModalOpen } from "../../state/community"

export const CommunityCreator = () => {
  const loading = createSignal(false)
  const state = createSignal({
    title: "",
    description: "",
  })
  const resetState = () => {
    state.value = {
      title: "",
      description: "",
    }
  }

  const onModalClose = () => {
    resetState()
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    loading.value = true
    const res = await createCommunity(state.value)
    loading.value = false
    if (!res) return
    resetState()
    communityCreatorModalOpen.value = false
    setPath(pathStore, `/communities/${res.id}`)
  }

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    state.value[target.id as keyof typeof state.value] = target.value
    state.notify()
  }

  return (
    <Modal
      onclose={onModalClose}
      visible={communityCreatorModalOpen}
      toggle={() => (communityCreatorModalOpen.value = false)}
    >
      <ModalHeader>
        <h2>Create Community</h2>
      </ModalHeader>
      <ModalBody>
        <form onsubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Name</label>
            <input
              type="text"
              id="title"
              oninput={handleChange}
              watch={state}
              bind:value={() => state.value.title}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              oninput={handleChange}
              watch={state}
              bind:value={() => state.value.description}
            ></textarea>
          </div>
          <div className="form-group">
            <Button
              type="submit"
              className="btn btn-primary hover-animate"
              watch={[loading, state]}
              bind:disabled={() =>
                loading.value ||
                !communityValidation.isCommunityValid(state.value.title, state.value.description)
              }
            >
              Create
              <EllipsisLoader watch={loading} bind:visible={() => loading.value} />
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  )
}
