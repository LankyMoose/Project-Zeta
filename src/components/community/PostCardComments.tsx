import * as Cinnabun from "cinnabun"
import { For, createSignal, computed } from "cinnabun"
import { CommunityPostComment, CommunityPostData } from "../../types/post"
import { authModalOpen, authModalState, pathStore, userStore } from "../../state/global"
import { isCommunityMember, communityJoinModalOpen } from "../../state/community"
import { addPostComment } from "../../client/actions/posts"
import { formatUTCDate } from "../../utils"
import { Button } from "../Button"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { commentValidation } from "../../db/validation"
import { AuthModalCallback } from "../../types/auth"
import { Link } from "cinnabun/router"

const CommentItem = ({ comment }: { comment: CommunityPostComment }) => {
  return (
    <div className="comment-item flex align-items-center gap" key={comment.id}>
      <div className="avatar-wrapper xs">
        <img className="avatar" src={comment.user.avatarUrl} alt={comment.user.name} />
      </div>
      <div className="flex flex-column gap-sm flex-grow text-sm">
        <div className="text-muted flex align-items-center gap justify-content-between">
          <Link to={`/users/${comment.user.id}`} store={pathStore} className="author">
            {comment.user.name}
          </Link>
          <span>{formatUTCDate(comment.createdAt.toString())}</span>
        </div>
        <p className="m-0 comment">{comment.content}</p>
      </div>
    </div>
  )
}

export const PostCardComments = ({ post }: { post: Cinnabun.Signal<CommunityPostData> }) => {
  const comments = computed(post, () => post.value.comments)
  return (
    <div className="post-card-comments flex flex-column gap">
      <div className="comments-list">
        <small
          watch={post}
          bind:visible={() => parseInt(post.value.totalComments) > post.value.comments.length}
          className="view-previous-comments"
        >
          <i>
            <a href="javascript:void(0)" className="block p-3 py-2 mb-3 text-center">
              View previous comments
            </a>
          </i>
        </small>
        <p
          className="text-muted m-0"
          watch={comments}
          bind:visible={() => comments.value.length === 0}
        >
          <small>
            <i>No comments yet.</i>
          </small>
        </p>
        <For each={comments} template={(comment) => <CommentItem comment={comment} />} />
      </div>
      <NewCommentForm post={post} />
    </div>
  )
}

const NewCommentForm = ({ post }: { post: Cinnabun.Signal<CommunityPostData> }) => {
  const newComment = createSignal("")
  const loading = createSignal(false)

  const handleSubmit = async (e: Event) => {
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
      post.value.comments.push(res)
      post.value.totalComments = (parseInt(post.value.totalComments) + 1).toString()
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
      className="flex align-items-center gap flex-wrap justify-content-end"
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
