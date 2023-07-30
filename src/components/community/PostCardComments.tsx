import * as Cinnabun from "cinnabun"
import { For, createSignal } from "cinnabun"
import { CommunityPostComment, CommunityPostData } from "../../types/post"
import { authModalOpen, authModalState, pathStore, userStore } from "../../state/global"
import { isCommunityMember, communityJoinModalOpen } from "../../state/community"
import { addPostComment, getPostComments } from "../../client/actions/posts"
import { formatUTCDate } from "../../utils"
import { Button } from "../Button"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { commentValidation } from "../../db/validation"
import { AuthModalCallback } from "../../types/auth"
import { Link } from "cinnabun/router"
import { POST_COMMENT_PAGE_SIZE } from "../../constants"

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

export const PostCardComments = ({
  post,
}: {
  post: Cinnabun.Signal<Partial<CommunityPostData> | null>
}) => {
  let offset = 0
  const comments = createSignal<CommunityPostComment[]>([])
  const loadingComments = createSignal(false)

  const loadMore = async () => {
    if (!post.value) return
    if (!post.value.communityId || !post.value.id) return
    if (loadingComments.value) return
    loadingComments.value = true

    const res = await getPostComments(post.value.communityId, post.value.id, offset)
    if (!res) return
    res.sort((a, b) => {
      const aDate = new Date(a.createdAt)
      const bDate = new Date(b.createdAt)
      if (aDate > bDate) return 1
      if (aDate < bDate) return -1
      return 0
    })
    comments.value.unshift(...res)
    comments.notify()
    offset += POST_COMMENT_PAGE_SIZE
    loadingComments.value = false
  }

  return (
    <div className="post-card-comments flex flex-column gap">
      <div className="comments-list">
        <Button
          className="btn view-previous-comments w-100 text-center"
          style="min-height:44px;"
          onclick={loadMore}
          watch={[post, loadingComments]}
          bind:disabled={() => loadingComments.value}
          bind:visible={() => parseInt(post.value?.totalComments ?? "0") > comments.value.length}
        >
          <i className="w-100 flex gap-sm align-items-center justify-content-center">
            View previous comments
            <EllipsisLoader watch={loadingComments} bind:visible={() => loadingComments.value} />
          </i>
        </Button>

        <p
          className="text-muted m-0"
          watch={comments}
          bind:visible={() => comments.value.length === 0}
        >
          <i>No comments yet.</i>
        </p>
        <For each={comments} template={(comment) => <CommentItem comment={comment} />} />
      </div>
      <NewCommentForm post={post} comments={comments} />
    </div>
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
