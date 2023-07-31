import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import { PostCard } from "../post/PostCard"
import { CommunityPostData } from "../../types/post"

export const CommunityPosts = ({ posts }: { posts: CommunityPostData[] }) => {
  return (
    <div className="flex flex-column">
      {posts.length ? (
        <div className="flex flex-column gap">
          <For each={posts} template={(post) => <PostCard post={post} />} />
        </div>
      ) : (
        <div>
          <i className="text-muted">No posts yet 😢</i>
        </div>
      )}
    </div>
  )
}
