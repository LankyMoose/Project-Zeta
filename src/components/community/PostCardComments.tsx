import * as Cinnabun from "cinnabun"
import { For, createSignal, computed } from "cinnabun"
import { CommunityPostComment, CommunityPostData } from "../../types/post"
import { communityJoinModalOpen, isCommunityMember, userStore } from "../../state"
import { addPostComment } from "../../client/actions/posts"
import { formatUTCDate } from "../../utils"
import { Button } from "../Button"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { commentValidation } from "../../db/validation"

const CommentItem = ({ comment }: { comment: CommunityPostComment }) => {
  return (
    <div className="comment-item flex align-items-center gap" key={comment.id}>
      <div className="avatar-wrapper sm">
        <img className="avatar" src={comment.user.avatarUrl} alt={comment.user.name} />
      </div>
      <div className="flex flex-column gap-sm flex-grow text-sm">
        <div className="text-muted flex align-items-center gap justify-content-between">
          <span className="author">{comment.user.name}</span>
          <span>{formatUTCDate(comment.createdAt.toString())}</span>
        </div>
        <p className="m-0 comment">{comment.content}</p>
      </div>
    </div>
  )
}

const CommentsList = ({ comments }: { comments: Cinnabun.Signal<CommunityPostComment[]> }) => {
  return (
    <div className="comments-list">
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
  )
}

export const PostCardComments = ({ post }: { post: Cinnabun.Signal<CommunityPostData> }) => {
  const comments = computed(post, () => post.value.comments)
  return (
    <div className="post-card-comments flex flex-column gap">
      <CommentsList comments={comments} />
      <NewCommentForm post={post} />
    </div>
  )
}

const NewCommentForm = ({ post }: { post: Cinnabun.Signal<CommunityPostData> }) => {
  const newComment = createSignal("")
  const loading = createSignal(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!isCommunityMember()) {
      communityJoinModalOpen.value = true
      return
    }
    e.preventDefault()
    loading.value = true
    const res = await addPostComment(post.value.id, newComment.value)
    if (res) {
      post.value.comments.push(res)
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
