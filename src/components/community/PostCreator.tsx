import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Button } from "../Button"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../Modal"
import { postValidation } from "../../db/validation"
import { addPost } from "../../client/actions/posts"
import { postCreatorModalOpen, selectedCommunity, userStore } from "../../state"
import { addNotification } from "../Notifications"

export const PostCreator = () => {
  const loading = createSignal(false)
  const state = createSignal({
    title: "",
    content: "",
  })

  const createPost = async () => {
    const { title, content } = state.value
    const { userId } = userStore.value ?? {}
    if (!userId)
      return addNotification({
        type: "error",
        text: "You must be logged in to create a post",
      })

    if (!selectedCommunity.value) {
      return addNotification({
        type: "error",
        text: "No community selected",
      })
    }
    loading.value = true

    console.log("Create post", state.value, selectedCommunity, userId)
    const res = await addPost({
      title,
      content,
      communityId: selectedCommunity.value,
      ownerId: userId,
    })
    console.log("Create post res", res)
  }

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    state.value[target.id as keyof typeof state.value] = target.value
    state.notify()
  }

  return (
    <>
      <Modal
        visible={postCreatorModalOpen}
        toggle={() => (postCreatorModalOpen.value = false)}
      >
        <ModalHeader>
          <h3>Create post</h3>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-column">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              bind:value={() => state.value.title}
              oninput={handleChange}
            />
          </div>
          <div className="flex flex-column">
            <label htmlFor="body">Content</label>
            <textarea
              id="content"
              bind:value={() => state.value.content}
              oninput={handleChange}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="btn btn-secondary hover-animate"
            watch={loading}
            bind:disabled={() => loading.value}
            onclick={() => (postCreatorModalOpen.value = false)}
          >
            Cancel
          </Button>
          <Button
            className="btn btn-primary hover-animate"
            watch={[loading, state]}
            bind:disabled={() =>
              loading.value ||
              !postValidation.isPostValid(
                state.value.title,
                state.value.content
              )
            }
            onclick={createPost}
          >
            Create post
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
