import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import { PostCard } from "../post/PostCard"
import { PostWithMeta } from "../../../types/post"
import { getCommunityPosts } from "../../../client/actions/communities"
import { SkeletonList } from "../loaders/SkeletonList"

export const CommunityPosts = ({ url_title }: { url_title?: string }) => {
  const posts = Cinnabun.createSignal<PostWithMeta[]>([])
  const loading = Cinnabun.createSignal(true)
  const loaded = Cinnabun.createSignal(false)

  const loadPosts = async (): Promise<PostWithMeta[] | void> => {
    const res = await getCommunityPosts(url_title!)

    if ("message" in res) {
      console.error(res.message)
      loading.value = false
      loaded.value = false
      return
    }
    posts.value = res
    loading.value = false
    loaded.value = true
  }

  if (Cinnabun.Cinnabun.isClient) {
    console.log("load posts")
    loadPosts()
  }

  return (
    <div className="flex flex-column">
      <div className="flex flex-column gap">
        <For each={posts} template={(post) => <PostCard post={post} />} />
        <div
          watch={[posts, loading, loaded]}
          bind:visible={() => !loading.value && loaded.value && posts.value.length === 0}
          className="w-100"
        >
          <i>
            <small className="text-muted">No posts yet.</small>
          </i>
        </div>
        <div
          watch={[loading, loaded]}
          bind:visible={() => loading.value && !loaded.value}
          className="w-100"
        >
          <SkeletonList numberOfItems={3} height="130px" className="w-100 flex flex-column gap " />
        </div>
      </div>
    </div>
  )
}
