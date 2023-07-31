import * as Cinnabun from "cinnabun"
import { getLatestPostsCommunities } from "../client/actions/communities"
import { pathStore } from "../state/global"
import { selectedCommunity, selectedCommunityPost } from "../state/community"
import { LatestPostsData } from "../types/post"
import { DefaultLoader } from "../components/loaders/Default"
import { AuthorTag } from "../components/AuthorTag"
import { Link } from "cinnabun/router"
import { timeSinceDate } from "../utils"
import { title } from "../Document"

export default function Home() {
  title.value = "Project Zeta"
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
            //return data.map((item) => <PostCard {...item} />)
            return (
              <ul className="card-list">
                <Cinnabun.For each={data} template={(item) => <PostCard {...item} />} />
              </ul>
            )
          }}
        </Cinnabun.Suspense>
      </section>
    </div>
  )
}

const PostCard = ({ post, community, user }: LatestPostsData) => {
  const viewPost = () => {
    selectedCommunityPost.value = {
      ...post,
      createdAt: new Date(post.createdAt),
    }
    window.history.pushState(null, "", `${window.location.pathname}?post=${post.id}`)
  }

  return (
    <div className="card" key={post.id}>
      <div className="card-title gap-lg flex justify-content-between">
        <h4 className="m-0 title flex-grow w-100">
          <a href="javascript:void(0)" onclick={viewPost}>
            {post.title}
          </a>
        </h4>
        <small className="text-right">
          <Link
            onBeforeNavigate={() => {
              selectedCommunity.value = { ...community }
              return true
            }}
            store={pathStore}
            to={`/communities/${community.url_title}`}
            className="text-primary nowrap"
          >
            {community.title}
          </Link>
        </small>
      </div>
      <div className="card-body">{post.content}</div>
      <div className="flex justify-content-between mt-auto">
        <div></div>
        <div className="flex flex-column align-items-end">
          <AuthorTag user={user} date={timeSinceDate(new Date(post.createdAt))} />
        </div>
      </div>
    </div>
  )
}
