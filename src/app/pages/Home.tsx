import * as Cinnabun from "cinnabun"
import { getLatestPostsCommunities } from "../../client/actions/communities"
import { pathStore } from "../state/global"
import { selectedCommunity } from "../state/community"
import { LatestPostsData } from "../../types/post"
import { AuthorTag } from "../components/AuthorTag"
import { Link } from "cinnabun/router"
import { timeSinceUTCDate } from "../../utils"
import { title } from "../Document"
import { CommentIcon } from "../components/icons/CommentIcon"
import { selectedPost } from "../state/post"
import { SkeletonList } from "../components/loaders/SkeletonList"

export default function Home() {
  title.value = "Project Zeta"
  return (
    <>
      <div className="page-title flex align-items-center justify-content-between gap flex-wrap">
        <h1>Latest posts</h1>
      </div>
      <div className=" page-body flex gap flex-wrap">
        <Cinnabun.Suspense promise={getLatestPostsCommunities} cache>
          {(loading: boolean, data?: LatestPostsData[]) => {
            if (loading) return <SkeletonList numberOfItems={6} className="card-list" />
            if (!data) return <div className="text-muted">No posts yet.</div>
            //return data.map((item) => <PostCard {...item} />)
            return (
              <ul className="card-list">
                <Cinnabun.For each={data} template={(item) => <PostCard {...item} />} />
              </ul>
            )
          }}
        </Cinnabun.Suspense>
      </div>
    </>
  )
}

const PostCard = ({ post, community, user }: LatestPostsData) => {
  const viewPost = () => {
    selectedPost.value = {
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
      <div className="flex justify-content-between align-items-end mt-auto">
        <div>
          <button type="button" className="btn text-sm p-0" onclick={viewPost}>
            <span className="text-muted flex gap-sm align-items-center justify-content-center">
              <CommentIcon />
              {post.totalComments ?? 0}
            </span>
          </button>
        </div>
        <div className="flex flex-column align-items-end">
          <AuthorTag user={user} date={timeSinceUTCDate(post.createdAt)} />
        </div>
      </div>
    </div>
  )
}
