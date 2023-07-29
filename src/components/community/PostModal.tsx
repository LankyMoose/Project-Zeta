import * as Cinnabun from "cinnabun"
import { selectedCommunityPost, selectedCommunity } from "../../state/community"
import { Modal, ModalHeader } from "../modal/Modal"

export const PostModal = () => {
  const show = Cinnabun.computed(selectedCommunityPost, () => {
    return !!selectedCommunityPost.value
  })

  const handleClose = () => {
    selectedCommunityPost.value = null
    window.history.pushState(null, "", `/communities/${selectedCommunity.value?.url_title}`)
  }

  return (
    <Modal visible={show} toggle={handleClose}>
      <ModalHeader watch={selectedCommunity} bind:children>
        <h2>Post {() => selectedCommunityPost.value}</h2>
      </ModalHeader>
    </Modal>
  )
}
