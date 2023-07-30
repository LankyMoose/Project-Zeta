import * as Cinnabun from "cinnabun"
import { For, createSignal, Cinnabun as cb } from "cinnabun"
import { CommunityPostComment } from "../../types/post"
import { pathStore } from "../../state/global"
import { getPostComments } from "../../client/actions/posts"
import { formatUTCDate } from "../../utils"
import { Link } from "cinnabun/router"
import { POST_COMMENT_PAGE_SIZE } from "../../constants"
import "./PostComments.css"
import { selectedCommunityPost, selectedPostComments } from "../../state/community"

const commentsPage = createSignal(0)
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
          <span>{formatUTCDate(comment.createdAt.toString())}</span>
        </div>
        <p className="m-0 comment">{comment.content}</p>
      </div>
    </div>
  )
}

export const PostComments = () => {
  const loadMoreComments = async () => {
    if (loadingMore.value) return
    if (!selectedCommunityPost.value || !selectedCommunityPost.value.communityId) return
    loadingMore.value = true

    const res = await getPostComments(
      selectedCommunityPost.value.communityId,
      selectedCommunityPost.value.id!,
      commentsPage.value * POST_COMMENT_PAGE_SIZE
    )
    if (!res) return
    console.log(res)
    selectedPostComments.value.push(...res)
    selectedPostComments.notify()
    loadingMore.value = false
  }

  commentsPage.subscribe(() => {
    if (!cb.isClient) return
    loadMoreComments()
  })

  selectedCommunityPost.subscribe(() => {
    if (!cb.isClient) return
    selectedPostComments.value = []
    commentsPage.value = 0
    //loadMoreComments()
  })

  const onScroll = () => {
    if (loadingMore.value) return
    debugger
    const bottomPadding = 200
    const { scrollTop, scrollHeight, clientHeight } = document.scrollingElement!
    if (scrollTop + clientHeight + bottomPadding >= scrollHeight) {
      commentsPage.value++
      commentsPage.notify()
    }
  }

  return (
    <div
      onMounted={() => window?.addEventListener("scroll", onScroll)}
      onUnmounted={() => window?.removeEventListener("scroll", onScroll)}
      className="post-card-comments flex flex-column gap"
    >
      <div className="comments-list">
        <p
          className="text-muted m-0"
          watch={selectedPostComments}
          bind:visible={() => selectedPostComments.value.length === 0}
        >
          <i>No comments yet.</i>
        </p>
        <For
          each={selectedPostComments}
          template={(comment) => <CommentItem comment={comment} />}
        />
      </div>
    </div>
  )
}
