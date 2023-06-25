import * as Cinnabun from "cinnabun"
import { getCommunities } from "../client/actions/communities"
import { Community } from "../db/schema"
import { CommunityList } from "../components/communities/CommunityList"
import { DefaultLoader } from "../components/loaders/Default"
import { Button } from "../components/Button"
import { userStore, isNotAuthenticated, communityCreatorModalOpen } from "../state"

export default function Communities() {
  return (
    <>
      <div className="page-title">
        <h2>Communities</h2>
        <Button
          watch={userStore}
          bind:disabled={isNotAuthenticated}
          bind:title={() => (userStore.value ? "" : "Login to create a community")}
          className="btn btn-primary hover-animate sm_btn-sm md_btn-md lg_btn-lg"
          onclick={() => (communityCreatorModalOpen.value = true)}
        >
          Create a Community
        </Button>
      </div>
      <div className="page-body">
        <Cinnabun.Suspense promise={getCommunities} cache>
          {(loading: boolean, res: Community[] | undefined) => {
            if (loading) return <DefaultLoader />
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
