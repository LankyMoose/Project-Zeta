import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { selectedCommunityPost, selectedCommunity, postModalOpen } from "../../state/community"
import { Modal, ModalBody, ModalHeader } from "../modal/Modal"
import { AuthorTag } from "../AuthorTag"
import { getPost } from "../../client/actions/posts"
import { PostCardComments } from "./PostCardComments"

const loading = createSignal(false)

const loadPost = async (communityId: string, postId: string) => {
  if (loading.value) return
  if (!postModalOpen.value) return
  loading.value = true
  const res = await getPost(communityId, postId)
  if (!postModalOpen.value) return

  selectedCommunityPost.value = res ?? null
  loading.value = false
}

selectedCommunityPost.subscribe((post) => {
  if (post?.id && !postModalOpen.value) {
    postModalOpen.value = true
    loadPost(selectedCommunity.value!.id!, post.id)
  }
})

export const PostModal = () => {
  const handleClose = () => {
    selectedCommunityPost.value = null
    postModalOpen.value = false
    window.history.pushState(null, "", `/communities/${selectedCommunity.value?.url_title}`)
  }

  return (
    <Modal large visible={postModalOpen} toggle={handleClose}>
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
  )
}
