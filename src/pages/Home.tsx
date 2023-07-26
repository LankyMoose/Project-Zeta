import * as Cinnabun from "cinnabun"
import { getLatestPostsFromMyCommunities } from "../client/actions/me"
import { getLatestPostsFromPublicCommunities } from "../client/actions/communities"
import { isAuthenticated, userStore } from "../state"
import { CommunityPostListData } from "../types/post"
import { DefaultLoader } from "../components/loaders/Default"
import { AuthorTag } from "../components/AuthorTag"

const PostCard = ({ post, community: _community, user }: CommunityPostListData) => {
  return (
    <div className="card" key={post.id}>
      <div className="card-title">{post.title}</div>
      <div className="card-body">{post.content}</div>
      <AuthorTag user={user} date={post.createdAt.toString()} />
    </div>
  )
}

const PostList = ({
  promiseFn,
}: {
  promiseFn: { (page?: number): Promise<void | CommunityPostListData[]> }
}) => {
  return (
    <Cinnabun.Suspense promise={promiseFn} cache>
      {(loading: boolean, data?: CommunityPostListData[]) => {
        if (loading) return <DefaultLoader />
        if (!data) return <></>
        return <Cinnabun.For each={data} template={(item) => <PostCard {...item} />} />
      }}
    </Cinnabun.Suspense>
  )
}

export default function Home() {
  return (
    <>
      <h1>Home</h1>
      <div className="flex gap flex-wrap">
        <section watch={userStore} bind:visible={isAuthenticated}>
          <div className="section-header">
            <h2>Latest from your communities</h2>
          </div>
          <PostList promiseFn={getLatestPostsFromMyCommunities} />
        </section>
        <section>
          <div className="section-header">
            <h2>Latest from public communities</h2>
          </div>
          <PostList promiseFn={getLatestPostsFromPublicCommunities} />
        </section>
      </div>
    </>
  )
}
