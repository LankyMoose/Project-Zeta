import * as Cinnabun from "cinnabun"
import { getCommunities } from "../client/actions/communities"
import { CommunityList } from "../components/communities/CommunityList"
import { DefaultLoader } from "../components/loaders/Default"
import { Button } from "../components/Button"
import { userStore, communityCreatorModalOpen, authModalOpen, authModalState } from "../state"
import { AuthModalCallback } from "../types/auth"
import { CommunityListData } from "../types/community"

export default function Communities() {
  const handleCreateCommunityClick = () => {
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to create a Community",
        message: "You must be logged in to create a Community.",
        callbackAction: AuthModalCallback.CreateCommunity,
      }
      authModalOpen.value = true
      return
    }
    communityCreatorModalOpen.value = true
  }
  return (
    <>
      <div className="page-title flex align-items-center justify-content-between gap flex-wrap">
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
