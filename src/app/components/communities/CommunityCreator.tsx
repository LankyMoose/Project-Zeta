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
    private: false,
    nsfw: false,
  })
  const resetState = () => {
    state.value = {
      title: "",
      description: "",
      private: false,
      nsfw: false,
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
    const value = target.type === "checkbox" ? target.checked : target.value

    //@ts-ignore
    state.value[target.id as keyof typeof state.value] = value
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

          <div className="form-group flex-row">
            <label htmlFor="private">Private</label>
            <input
              id="private"
              type="checkbox"
              className="form-control"
              watch={state}
              bind:checked={() => state.value.private ?? false}
              oninput={handleChange}
            />
          </div>
          <div className="form-group flex-row">
            <label htmlFor="private">NSFW </label>
            <input
              id="nsfw"
              type="checkbox"
              className="form-control"
              watch={state}
              bind:checked={() => state.value.nsfw ?? false}
              oninput={handleChange}
            />
          </div>
          <div
            watch={state}
            bind:visible={() => state.value.nsfw && !state.value.private}
            className="form-error"
          >
            <p>NSFW communities must be private.</p>
          </div>
          <div className="form-group">
            <Button
              type="submit"
              className="btn btn-primary hover-animate"
              watch={[loading, state]}
              bind:disabled={() =>
                loading.value || !communityValidation.isCommunityValid(state.value)
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
