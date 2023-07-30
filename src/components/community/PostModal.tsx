import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import {
  selectedCommunityPost,
  selectedCommunity,
  postModalOpen,
  communityJoinModalOpen,
  isCommunityMember,
  selectedPostComments,
} from "../../state/community"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../modal/Modal"
import { AuthorTag } from "../AuthorTag"
import { addPostComment, getPost } from "../../client/actions/posts"
import { PostComments } from "./PostComments"
import { CommunityPostComment, CommunityPostData } from "../../types/post"
import { authModalOpen, authModalState, userStore } from "../../state/global"
import { commentValidation } from "../../db/validation"
import { AuthModalCallback } from "../../types/auth"
import { Button } from "../Button"
import { EllipsisLoader } from "../loaders/Ellipsis"

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
        <div className="post-content">
          <p watch={selectedCommunityPost} bind:children>
            {() => selectedCommunityPost.value?.content ?? ""}
          </p>
        </div>
        <PostComments post={selectedCommunityPost} />
      </ModalBody>
      <ModalFooter>
        <NewCommentForm post={selectedCommunityPost} comments={selectedPostComments} />
      </ModalFooter>
    </Modal>
  )
}

const NewCommentForm = ({
  post,
  comments,
}: {
  post: Cinnabun.Signal<Partial<CommunityPostData> | null>
  comments: Cinnabun.Signal<CommunityPostComment[]>
}) => {
  const newComment = createSignal("")
  const loading = createSignal(false)

  const handleSubmit = async (e: Event) => {
    if (!post.value) return
    if (!post.value.communityId || !post.value.id) return
    e.preventDefault()
    if (!userStore.value) {
      if (!userStore.value) {
        authModalState.value = {
          title: "Log in to interact with this post",
          message: "You must be logged in to interact with community posts.",
          callbackAction: AuthModalCallback.ViewCommunity,
        }
        authModalOpen.value = true
        return
      }
      return
    }
    if (!isCommunityMember()) {
      communityJoinModalOpen.value = true
      return
    }
    e.preventDefault()
    loading.value = true
    const res = await addPostComment(post.value.id, newComment.value)
    if (res) {
      comments.value.push(res)
      comments.notify()
      post.value.totalComments = (parseInt(post.value.totalComments ?? "0") + 1).toString()
      post.notify()
      newComment.value = ""
    }
    loading.value = false
  }

  const handleInput = (e: Event) => {
    e.preventDefault()
    newComment.value = (e.target as HTMLInputElement).value
  }

  return (
    <form
      className="flex-grow flex align-items-center gap flex-wrap justify-content-end"
      onsubmit={handleSubmit}
    >
      <div className="flex align-items-center gap flex-wrap flex-grow">
        <div className="avatar-wrapper sm">
          <img className="avatar" src={userStore.value?.picture} alt={userStore.value?.name} />
        </div>
        <div className="flex-grow">
          <textarea
            className="form-control"
            placeholder="Write a comment..."
            watch={newComment}
            bind:value={() => newComment.value}
            oninput={handleInput}
          />
        </div>
      </div>
      <Button
        watch={[loading, newComment]}
        bind:disabled={() => loading.value || !commentValidation.isCommentValid(newComment.value)}
        type="submit"
        className="btn btn-primary hover-animate"
      >
        Add Comment
        <EllipsisLoader watch={loading} bind:visible={() => loading.value} />
      </Button>
    </form>
  )
}
