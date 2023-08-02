import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"

import { communityJoinModalOpen, selectedCommunityUrlTitle } from "../../state/community"
import { authModalOpen, authModalState, userStore } from "../../state/global"
import { postModalOpen, selectedPost, postCommentsPage } from "../../state/post"

import { Modal, ModalBody, ModalFooter, ModalHeader } from "../modal/Modal"
import { AuthorTag } from "../AuthorTag"
import { addPostComment, addPostReaction, getPost } from "../../../client/actions/posts"
import { PostComments } from "./PostComments"
import { CommunityPostDataWithComments } from "../../../types/post"
import { commentValidation } from "../../../db/validation"
import { Button } from "../../components/Button"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { timeSinceUTCDate } from "../../../utils"
import { IconButton } from "../../components/IconButton"
import { ThumbsUpIcon, ThumbsDownIcon } from "../icons"
import { API_ERROR } from "../../../constants"
import { UserIcon } from "../icons/UserIcon"
import { SkeletonElement } from "../SkeletonElement"

const loading = createSignal(false)

const loadPost = async (postId: string) => {
  if (loading.value) return
  if (!postModalOpen.value) return
  loading.value = true
  const res = await getPost(postId)
  if (!postModalOpen.value) return
  if (selectedPost.value) {
    if (selectedPost.value.id === res?.id) {
      selectedPost.value = res ?? null
      loading.value = false
      return
    }
  }
}

selectedPost.subscribe((post) => {
  if (post?.id && !postModalOpen.value) {
    postModalOpen.value = true
    loadPost(post.id)
  } else if (!post?.id && postModalOpen.value) {
    postModalOpen.value = false
  }
})

export const PostModal = () => {
  const reacting = createSignal(false)

  const state = Cinnabun.computed(selectedPost, () => {
    return selectedPost.value
  })

  const handleClose = () => {
    loading.value = false
    selectedPost.value = null
    postModalOpen.value = false
    postCommentsPage.value = 0
    window.history.pushState(null, "", window.location.pathname)
  }

  const addReaction = async (reaction: boolean) => {
    if (reacting.value) return
    if (!selectedPost.value?.id) return
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to interact with this post",
        message: "You must be logged in to interact with community posts.",
        callbackState: {
          view: {
            post: selectedPost.value.id,
            community: selectedCommunityUrlTitle.value ?? undefined,
          },
        },
      }
      authModalOpen.value = true
      return
    }

    if (selectedPost.value.userReaction === reaction) return

    reacting.value = true
    const res = await addPostReaction(selectedPost.value.id, reaction)
    if (!selectedPost.value) {
      reacting.value = false
      return
    }

    if ("message" in res) {
      if (res.message === API_ERROR.UNAUTHORIZED) {
        communityJoinModalOpen.value = true
        reacting.value = false
        return
      }
    } else {
      if (!selectedPost.value.reactions)
        selectedPost.value.reactions = {
          positive: 0,
          negative: 0,
        }

      if (selectedPost.value.userReaction === true) {
        selectedPost.value.reactions.positive--
      } else if (selectedPost.value.userReaction === false) {
        selectedPost.value.reactions.negative--
      }
      if (reaction === true) {
        selectedPost.value.reactions.positive++
      } else {
        selectedPost.value.reactions.negative++
      }
      selectedPost.value.userReaction = reaction
      state.notify()
    }

    reacting.value = false
  }

  return (
    <Modal large visible={postModalOpen} toggle={handleClose}>
      <div watch={loading} bind:children>
        {() =>
          loading.value ? (
            <>
              <ModalHeader className="modal-header flex flex-column gap-lg">
                <div className="flex gap-lg align-items-start">
                  <SkeletonElement tag="h2" style="height:2.5rem; width:100%;" />
                  <div style="width: 100px" />
                  <SkeletonElement
                    tag="div"
                    className="rounded-full"
                    style="height:2.5rem; min-width: 2.5rem;"
                  />
                </div>
                <div>
                  <SkeletonElement tag="p" style="min-height:1.5rem; width:100%;" />
                </div>
                <div className="flex justify-content-end">
                  <div className="flex gap post-reactions">
                    <SkeletonElement
                      tag="div"
                      className="rounded-sm"
                      style="height:1.5rem; min-width: 2.5rem;"
                    />
                    <SkeletonElement
                      tag="div"
                      className="rounded-sm"
                      style="height:1.5rem; min-width: 2.5rem;"
                    />
                  </div>
                </div>
                <div className="flex gap ">
                  <SkeletonElement
                    tag="div"
                    className="rounded-full"
                    style="height:2.5rem; min-width: 2.5rem;"
                  />
                  <SkeletonElement tag="p" style="min-height:3rem; width:100%;" />
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-column gap-lg">
                  <div className="flex gap">
                    <SkeletonElement
                      tag="div"
                      className="rounded-full"
                      style="height:2.5rem; min-width: 2.5rem;"
                    />
                    <SkeletonElement tag="p" style="min-height:1.5rem; width:100%;" />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="modal-footer p-2">
                <SkeletonElement tag="div" className="w-100" style="min-height:3rem;" disabled />
              </ModalFooter>
            </>
          ) : (
            <>
              <ModalHeader
                className="modal-header flex flex-column gap-lg"
                watch={selectedPost}
                bind:children
              >
                <div className="flex gap-lg align-items-start">
                  <h2>{() => selectedPost.value?.title ?? ""}</h2>
                  {() =>
                    selectedPost.value?.user && selectedPost.value.createdAt ? (
                      <div className="ml-auto">
                        <AuthorTag
                          user={selectedPost.value.user!}
                          date={timeSinceUTCDate(selectedPost.value.createdAt)}
                        />
                      </div>
                    ) : (
                      <></>
                    )
                  }
                </div>
                <div className="post-content">
                  <p watch={selectedPost} bind:children className="m-0">
                    {() => selectedPost.value?.content ?? ""}
                  </p>
                </div>
                <div
                  watch={selectedPost}
                  bind:visible={() => typeof selectedPost.value?.userReaction !== "undefined"}
                  className="flex justify-content-end"
                >
                  <div className="flex gap post-reactions">
                    <IconButton
                      onclick={() => addReaction(true)}
                      bind:className={() =>
                        `icon-button flex align-items-center gap-sm ${
                          state.value?.userReaction === true ? "selected" : ""
                        }`
                      }
                      watch={[userStore, reacting, state]}
                      bind:disabled={() => reacting.value}
                    >
                      <ThumbsUpIcon
                        color="var(--primary)"
                        color:hover="var(--primary-light)"
                        className="text-rg"
                      />
                      <small className="text-muted" watch={state} bind:children>
                        {() => state.value?.reactions?.positive ?? 0}
                      </small>
                    </IconButton>
                    <IconButton
                      onclick={() => addReaction(false)}
                      bind:className={() =>
                        `icon-button flex align-items-center gap-sm ${
                          state.value?.userReaction === false ? "selected" : ""
                        }`
                      }
                      watch={[userStore, reacting, state]}
                      bind:disabled={() => reacting.value}
                    >
                      <ThumbsDownIcon
                        color="var(--primary)"
                        color:hover="var(--primary-light)"
                        className="text-rg"
                      />
                      <small className="text-muted" watch={state} bind:children>
                        {() => state.value?.reactions?.negative ?? 0}
                      </small>
                    </IconButton>
                  </div>
                </div>
                <div watch={selectedPost} bind:visible={() => !!selectedPost.value?.comments}>
                  <NewCommentForm post={selectedPost} />
                </div>
              </ModalHeader>
              <ModalBody>
                <PostComments post={selectedPost} />
              </ModalBody>
              <ModalFooter className="modal-footer p-2">
                <Button
                  className="btn w-100 flex justify-content-center py-3 text-muted text-rg"
                  onclick={handleClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )
        }
      </div>
    </Modal>
  )
}

const NewCommentForm = ({
  post,
}: {
  post: Cinnabun.Signal<Partial<CommunityPostDataWithComments> | null>
}) => {
  const newComment = createSignal("")
  const loading = createSignal(false)

  const handleSubmit = async (e: Event) => {
    if (!post.value) return
    if (!post.value.communityId || !post.value.id) return
    e.preventDefault()
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to interact with this post",
        message: "You must be logged in to interact with community posts.",
        callbackState: {
          view: {
            post: post.value.id,
            community: selectedCommunityUrlTitle.value ?? undefined,
          },
        },
      }
      authModalOpen.value = true
      return
    }
    e.preventDefault()
    loading.value = true
    const res = await addPostComment(post.value.id, newComment.value)
    if (res && "message" in res) {
      if (res.message === API_ERROR.UNAUTHORIZED) {
        communityJoinModalOpen.value = true
        loading.value = false
        return
      }
    } else if (res) {
      if (!post.value.comments) post.value.comments = []
      post.value.comments.unshift(res)
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
        {userStore.value?.picture ? (
          <div className="avatar-wrapper sm">
            <img className="avatar" src={userStore.value?.picture} alt={userStore.value?.name} />
          </div>
        ) : (
          <div className="avatar-wrapper sm">
            <UserIcon className="avatar" />
          </div>
        )}
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
