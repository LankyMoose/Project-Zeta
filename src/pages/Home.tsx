import * as Cinnabun from "cinnabun"
import { getLatestPostsCommunities } from "../client/actions/communities"
import { pathStore } from "../state/global"
import { selectedCommunity } from "../state/community"
import { LatestPostsData } from "../types/post"
import { DefaultLoader } from "../components/loaders/Default"
import { AuthorTag } from "../components/AuthorTag"
import { Link } from "cinnabun/router"

const PostCard = ({ post, community, user }: LatestPostsData) => {
  return (
    <div className="card" key={post.id}>
      <div className="card-title gap-lg flex justify-content-between">
        {post.title}
        <Link
          onBeforeNavigate={() => {
            selectedCommunity.value = { ...community }
            return true
          }}
          store={pathStore}
          to={`/communities/${community.url_title}`}
          className="text-primary"
        >
          {community.title}
        </Link>
      </div>
      <div className="card-body">{post.content}</div>
      <div className="flex justify-content-between">
        <div></div>
        <div className="flex flex-column align-items-end">
          <AuthorTag user={user} date={post.createdAt.toString()} />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex gap flex-wrap">
      <section>
        <div className="section-header">
          <h2>Latest posts</h2>
        </div>
        <Cinnabun.Suspense promise={getLatestPostsCommunities} cache>
          {(loading: boolean, data?: LatestPostsData[]) => {
            if (loading) return <DefaultLoader />
            if (!data) return <div className="text-muted">No posts yet.</div>
            return <Cinnabun.For each={data} template={(item) => <PostCard {...item} />} />
          }}
        </Cinnabun.Suspense>
      </section>
    </div>
  )
}
