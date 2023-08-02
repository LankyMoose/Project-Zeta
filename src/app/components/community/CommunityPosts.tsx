import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import { PostCard } from "../post/PostCard"
import { CommunityPostData } from "../../../types/post"
import { getCommunityPosts } from "../../../client/actions/communities"
import { SkeletonList } from "../loaders/SkeletonList"

const posts = Cinnabun.createSignal<CommunityPostData[]>([])
let last_title = ""
const loadingPosts = Cinnabun.createSignal(false)

export const CommunityPosts = ({ url_title }: { url_title?: string }) => {
  const loadPosts = async (): Promise<CommunityPostData[] | void> => {
    if (loadingPosts.value) return
    if (url_title === last_title) return

    last_title = url_title!
    posts.value = []
    loadingPosts.value = true

    const res = await getCommunityPosts(url_title!)

    if ("message" in res) {
      console.error(res.message)
      return
    }
    posts.value = res
    loadingPosts.value = false
  }

  return (
    <div onMounted={loadPosts} className="flex flex-column">
      <div className="flex flex-column gap">
        <For each={posts} template={(post) => <PostCard post={post} />} />
        <div
          watch={[posts, loadingPosts]}
          bind:visible={() => !loadingPosts.value && posts.value.length === 0}
          className="w-100"
        >
          <i>
            <small className="text-muted">No posts yet.</small>
          </i>
        </div>
        <SkeletonList
          watch={loadingPosts}
          bind:visible={() => loadingPosts.value}
          numberOfItems={5}
          height="130px"
          className="w-100 flex flex-column gap "
        />
      </div>
    </div>
  )
}
