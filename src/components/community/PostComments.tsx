import * as Cinnabun from "cinnabun"
import { For, createSignal, Cinnabun as cb } from "cinnabun"
import { CommunityPostComment } from "../../types/post"
import { pathStore } from "../../state/global"
import { getPostComments } from "../../client/actions/posts"
import { timeSinceDate } from "../../utils"
import { Link } from "cinnabun/router"
import { POST_COMMENT_PAGE_SIZE } from "../../constants"
import "./PostComments.css"
import { selectedCommunityPost } from "../../state/community"
import { EllipsisLoader } from "../loaders/Ellipsis"

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
      selectedCommunityPost.value.communityId,
      selectedCommunityPost.value.id!,
      commentsPage.value * POST_COMMENT_PAGE_SIZE
    )
    if (!res) return
    selectedCommunityPost.value.comments?.push(...res)
    comments.notify()
    loadingMore.value = false
  }

  commentsPage.subscribe(() => {
    if (!cb.isClient || commentsPage.value === 0) return
    loadMoreComments()
  })

  const onScroll = () => {
    if (loadingMore.value) return
    const bottomPadding = 200
    const { scrollTop, scrollHeight, clientHeight } = document.scrollingElement!
    if (scrollTop + clientHeight + bottomPadding >= scrollHeight) {
      console.log("load more")
      //commentsPage.value++
      //commentsPage.notify()
    }
  }

  return (
    <div
      onMounted={() => window?.addEventListener("scroll", onScroll)}
      onUnmounted={() => window?.removeEventListener("scroll", onScroll)}
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
