import * as Cinnabun from "cinnabun"
import { For, createSignal, Cinnabun as cb } from "cinnabun"
import { CommunityPostComment } from "../../types/post"
import { pathStore } from "../../state/global"
import { getPostComments } from "../../client/actions/posts"
import { timeSinceDate } from "../../utils"
import { Link } from "cinnabun/router"
import { POST_COMMENT_PAGE_SIZE } from "../../constants"
import "./PostComments.css"
import { postCommentsPage, selectedCommunityPost } from "../../state/community"
import { EllipsisLoader } from "../loaders/Ellipsis"

const loadingMore = createSignal<boolean>(false)

const CommentItem = ({ comment }: { comment: CommunityPostComment }) => {
  return (
    <div className="comment-item flex align-items-center gap py-3" key={comment.id}>
      <div className="avatar-wrapper sm">
        <img className="avatar" src={comment.user.avatarUrl} alt={comment.user.name} />
      </div>
      <div className="flex flex-column gap-sm flex-grow text-sm">
        <div className="text-muted flex align-items-center gap justify-content-between">
          <Link to={`/users/${comment.user.id}`} store={pathStore} className="author">
            {comment.user.name}
          </Link>
          <span>{timeSinceDate(new Date(comment.createdAt))}</span>
        </div>
        <p className="m-0 comment">{comment.content}</p>
      </div>
    </div>
  )
}

export const PostComments = () => {
  const comments = Cinnabun.computed(
    selectedCommunityPost,
    () => selectedCommunityPost.value?.comments ?? []
  )
  const loadMoreComments = async () => {
    if (!selectedCommunityPost.value || !selectedCommunityPost.value.communityId) return
    loadingMore.value = true

    const res = await getPostComments(
      selectedCommunityPost.value.id!,
      postCommentsPage.value * POST_COMMENT_PAGE_SIZE
    )
    if (!res) return
    if (!selectedCommunityPost.value) return

    if (!selectedCommunityPost.value.comments) selectedCommunityPost.value.comments = []
    selectedCommunityPost.value.comments.push(...res)
    comments.notify()
    loadingMore.value = false
  }

  postCommentsPage.subscribe(() => {
    if (!cb.isClient || postCommentsPage.value === 0) return
    loadMoreComments()
  })

  const onScroll = (e: Event) => {
    if (loadingMore.value) return
    const totalComments = parseInt(selectedCommunityPost.value?.totalComments ?? "0")
    const commentsLength = selectedCommunityPost.value?.comments?.length ?? 0
    if (totalComments <= commentsLength) return

    const bottomPadding = 200
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement
    if (scrollTop + clientHeight + bottomPadding >= scrollHeight) {
      loadingMore.value = true
      postCommentsPage.value++
    }
  }

  return (
    <div
      onMounted={() => document.querySelector(".modal-outer")?.addEventListener("scroll", onScroll)}
      onUnmounted={() =>
        document.querySelector(".modal-outer")?.removeEventListener("scroll", onScroll)
      }
      className="post-card-comments flex flex-column gap"
    >
      <div
        watch={comments}
        bind:visible={() => comments.value.length > 0}
        className="comments-list"
      >
        <For each={comments} template={(comment) => <CommentItem comment={comment} />} />
      </div>

      <div
        watch={[loadingMore, selectedCommunityPost]}
        bind:visible={() => loadingMore.value || !selectedCommunityPost.value?.comments}
        className="flex justify-content-center"
      >
        <EllipsisLoader />
      </div>

      <div
        watch={selectedCommunityPost}
        bind:visible={() => selectedCommunityPost.value?.comments?.length === 0}
        className="flex justify-content-center"
      >
        <p className="text-muted m-0">
          <i>No comments yet.</i>
        </p>
      </div>
    </div>
  )
}
