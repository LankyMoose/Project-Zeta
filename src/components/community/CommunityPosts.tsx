import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import { Post } from "../../db/schema"
import { PostCard } from "./PostCard"

export const CommunityPosts = ({ posts }: { posts: Post[] }) => {
  return (
    <div className="flex flex-column">
      {posts.length ? (
        <div className="flex flex-column">
          <For each={posts} template={(post) => <PostCard post={post} />} />
        </div>
      ) : (
        <div>No posts yet 😢</div>
      )}
    </div>
  )
}
