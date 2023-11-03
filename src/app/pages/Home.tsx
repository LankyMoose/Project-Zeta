import * as Cinnabun from "cinnabun"
import { getLatestPostsCommunities } from "../../client/actions/communities"
import { PostWithMeta } from "../../types/post"
import { title } from "../Document"
import { SkeletonList } from "../components/loaders/SkeletonList"
import { PostCard } from "../components/post/PostCard"
import { PageTitle } from "../components/PageTitle"
import { PageBody } from "../components/PageBody"

export default function Home() {
  title.value = "Project Zeta"
  return (
    <>
      <PageTitle>
        <h1>Latest posts</h1>
      </PageTitle>

      <PageBody>
        <div style="max-width: 600px; margin: 0 auto;">
          <Cinnabun.Suspense promise={getLatestPostsCommunities} cache>
            {(loading: boolean, data?: PostWithMeta[]) => {
              if (loading)
                return <SkeletonList numberOfItems={3} height="140px" className="card-list w-100" />
              if (!data || !data.length)
                return (
                  <div className="text-muted">
                    <i>No posts yet.</i>
                  </div>
                )
              //return data.map((item) => <PostCard {...item} />)
              return (
                <ul className="card-list feed w-100">
                  <Cinnabun.For each={data} template={(item) => <PostCard post={item} />} />
                </ul>
              )
            }}
          </Cinnabun.Suspense>
        </div>
      </PageBody>
    </>
  )
}
