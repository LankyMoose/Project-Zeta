import * as Cinnabun from "cinnabun"
import { For, createSignal } from "cinnabun"
import { CommunityPostComment, CommunityPostData } from "../../types/post"
import { pathStore } from "../../state/global"
import { getPostComments } from "../../client/actions/posts"
import { formatUTCDate } from "../../utils"
import { Button } from "../Button"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { Link } from "cinnabun/router"
import { POST_COMMENT_PAGE_SIZE } from "../../constants"
import "./PostComments.css"

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

export const PostComments = ({
  post,
  comments,
}: {
  post: Cinnabun.Signal<Partial<CommunityPostData> | null>
  comments: Cinnabun.Signal<CommunityPostComment[]>
}) => {
  let offset = 0
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
    </div>
  )
}
