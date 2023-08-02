import * as Cinnabun from "cinnabun"
import { getCommunities } from "../../client/actions/communities"
import { CommunityList } from "../components/communities/CommunityList"
import { Button } from "../components/Button"
import { userStore, authModalOpen, authModalState } from "../state/global"
import { communityCreatorModalOpen } from "../state/community"
import { CommunityListData } from "../../types/community"
import { title } from "../Document"
import { SkeletonList } from "../components/loaders/SkeletonList"

export default function Communities({ query }: { query: { createcommunity?: string } }) {
  title.value = "Communities | Project Zeta"
  const handleCreateCommunityClick = () => {
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to create a Community",
        message: "You must be logged in to create a Community.",
        callbackState: {
          create: {
            community: true,
          },
        },
      }
      authModalOpen.value = true
      return
    }
    communityCreatorModalOpen.value = true
  }

  const onMounted = () => {
    if (query.createcommunity) {
      handleCreateCommunityClick()
      window.history.pushState(null, "", window.location.pathname)
    }
  }

  return (
    <>
      <div
        onMounted={onMounted}
        className="page-title flex align-items-center justify-content-between gap flex-wrap"
      >
        <h1>Communities</h1>
        <Button
          className="btn btn-primary hover-animate sm_btn-sm md_btn-md lg_btn-lg"
          onclick={handleCreateCommunityClick}
        >
          Create a Community
        </Button>
      </div>
      <div className="page-body">
        <Cinnabun.Suspense promise={getCommunities} cache>
          {(loading: boolean, res: CommunityListData[] | undefined) => {
            if (loading) return <SkeletonList numberOfItems={6} className="card-list" />
            if (!res)
              return (
                <div>
                  <span className="text-danger">Oops! Something went wrong 😢</span>
                </div>
              )
            if (res.length === 0)
              return (
                <div>
                  <span className="text-muted">
                    There are no communities to show... Why not create one?
                  </span>
                </div>
              )

            return <CommunityList communities={res} />
          }}
        </Cinnabun.Suspense>
      </div>
    </>
  )
}
