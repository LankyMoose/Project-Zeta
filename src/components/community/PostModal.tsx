import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { selectedCommunityPost, selectedCommunity } from "../../state/community"
import { Modal, ModalBody, ModalHeader } from "../modal/Modal"
import { AuthorTag } from "../AuthorTag"
import { getPost } from "../../client/actions/posts"
import { PostCardComments } from "./PostCardComments"

if (Cinnabun.Cinnabun.isClient) {
  const hash = window.location.hash
  if (hash) {
    const id = hash.substring(1)
    console.log("postId", id)
    selectedCommunityPost.value = {
      id,
    }
  }
}

export const PostModal = () => {
  const loading = createSignal(false)

  const show = Cinnabun.createSignal(false)

  const loadPost = async () => {
    if (!selectedCommunity.value?.id || !selectedCommunityPost.value?.id) return
    if (loading.value) return
    loading.value = true
    const res = await getPost(selectedCommunity.value.id, selectedCommunityPost.value.id)
    console.log("loaded post", res)
    if (show.value) selectedCommunityPost.value = res ?? null

    loading.value = false
  }

  const handleClose = () => {
    selectedCommunityPost.value = null
    show.value = false
    window.history.pushState(null, "", `/communities/${selectedCommunity.value?.url_title}`)
  }

  return (
    <div
      watch={[selectedCommunity, selectedCommunityPost]}
      bind:visible={() => {
        if (selectedCommunityPost.value && selectedCommunity.value) {
          if (!show.value) {
            show.value = true
            loadPost()
          }
        }
        return show.value
      }}
    >
      <Modal large visible={show} toggle={handleClose}>
        <ModalHeader
          className="modal-header flex gap-lg align-items-start"
          watch={selectedCommunityPost}
          bind:children
        >
          <h2>{() => selectedCommunityPost.value?.title ?? ""}</h2>
          {() =>
            selectedCommunityPost.value?.user && selectedCommunityPost.value.createdAt ? (
              <div className="ml-auto">
                <AuthorTag
                  user={selectedCommunityPost.value.user!}
                  date={selectedCommunityPost.value.createdAt!.toString()}
                />
              </div>
            ) : (
              <></>
            )
          }
        </ModalHeader>
        <ModalBody>
          <p watch={selectedCommunityPost} bind:children>
            {() => selectedCommunityPost.value?.content ?? ""}
          </p>
          <PostCardComments post={selectedCommunityPost} />
        </ModalBody>
      </Modal>
    </div>
  )
}
