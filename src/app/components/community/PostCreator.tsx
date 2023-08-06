import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Button } from "../../components/Button"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../modal/Modal"
import { postValidation } from "../../../db/validation"
import { addPost, updatePostMedia } from "../../../client/actions/posts"
import { userStore } from "../../state/global"
import { selectedCommunity, postCreatorModalOpen } from "../../state/community"
import { addNotification } from "../notifications/Notifications"
import { MultimediaDropzone, SelectedFile } from "../dragndrop/MultimediaDropzone"
import { ASSETS_URL } from "../../../constants"
import { EllipsisLoader } from "../loaders/Ellipsis"

export const PostCreator = () => {
  const loading = createSignal(false)
  const state = createSignal({
    title: "",
    content: "",
  })
  const files = createSignal<SelectedFile[]>([])

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

    const res = await addPost({
      title,
      content,
      communityId: selectedCommunity.value.id!,
      numMedia: files.value.length,
    })

    if (!res || !res) {
      loading.value = false
      return addNotification({
        type: "error",
        text: "Something went wrong",
      })
    }

    if (res.urls.length > 0) {
      await Promise.all(
        files.value.map(async (file, i) => {
          const imgRes = await fetch(res.urls[i], {
            method: "PUT",
            body: file.file,
            headers: {
              "Content-Type": file.file.type,
            },
          })

          if (!imgRes.ok) return
          file.uploadUrl = ASSETS_URL + new URL(imgRes.url).pathname
        })
      )
      await updatePostMedia(
        res.post.id,
        files.value.map((f) => f.uploadUrl!)
      )
    }

    addNotification({
      type: "success",
      text: "Post created",
    })
    loading.value = false
    window.location.href = `/communities/${selectedCommunity.value.url_title}?post=${res.post.id}`
  }

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    state.value[target.id as keyof typeof state.value] = target.value
    state.notify()
  }

  return (
    <>
      <Modal
        size="md"
        visible={postCreatorModalOpen}
        toggle={() => (postCreatorModalOpen.value = false)}
      >
        <ModalHeader>
          <h2>Create post</h2>
        </ModalHeader>
        <ModalBody>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              bind:value={() => state.value.title}
              oninput={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea id="content" bind:value={() => state.value.content} oninput={handleChange} />
          </div>
          <div className="form-group">
            <MultimediaDropzone files={files} />
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
            bind:disabled={() => loading.value || !postValidation.isPostValid(state.value)}
            onclick={createPost}
          >
            Create post
            <EllipsisLoader watch={loading} bind:visible={() => loading.value} />
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
