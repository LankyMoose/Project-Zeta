import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Button } from "../Button"
import { Portal } from "../Portal"
import { Modal, ModalBody, ModalHeader } from "../Modal"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { KeyboardListener } from "cinnabun/listeners"
import { createCommunity } from "../../client/actions/communities"
import { pathStore } from "../../state"
import { communityValidation } from "../../db/validation"
import { setPath } from "cinnabun/router"

const communityCreatorOpen = createSignal(false)

const CommunityCreator = () => {
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
    communityCreatorOpen.value = false
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
      visible={communityCreatorOpen}
      toggle={() => (communityCreatorOpen.value = !communityCreatorOpen.value)}
    >
      <ModalHeader>
        <h2>Create Community</h2>
      </ModalHeader>
      <ModalBody>
        <KeyboardListener
          keys={["Escape"]}
          onCapture={() => (communityCreatorOpen.value = false)}
        />

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
                !communityValidation.isCommunityValid(
                  state.value.title,
                  state.value.description
                )
              }
            >
              Create
              <EllipsisLoader
                watch={loading}
                bind:visible={() => loading.value}
              />
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  )
}

export const CreateCommunity = () => {
  return (
    <>
      <Button
        className="btn btn-primary hover-animate"
        onclick={() => (communityCreatorOpen.value = true)}
      >
        Create Community
      </Button>
      <Portal>
        <CommunityCreator />
      </Portal>
    </>
  )
}
