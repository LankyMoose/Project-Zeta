import * as Cinnabun from "cinnabun"
import "./Page.css"
import { getCommunity } from "../../client/actions/communities"
import { Community } from "../../db/schema"
import { DefaultLoader } from "../../components/loaders/Default"
import { setPath } from "cinnabun/router"
import {
  isNotAuthenticated,
  pathStore,
  postCreatorModalOpen,
  selectedCommunity,
  userStore,
} from "../../state"
import { CommunityPosts } from "../../components/community/CommunityPosts"
import { CommunityData } from "../../types/community"
import { Button } from "../../components/Button"
import { CommunityMemberCard } from "../../components/community/CommunityMemberCard"

export default function CommunitiesPage({ params }: { params?: { url_title?: string } }) {
  if (!params?.url_title) return setPath(pathStore, "/communities")

  const loadCommunity = async (): Promise<Community | undefined> => {
    const res = await getCommunity(params.url_title!)
    if (!res) {
      setPath(pathStore, "/communities")
      return
    }
    selectedCommunity.value = {
      id: res.id,
      url_title: params.url_title!,
    }
    return res
  }

  return (
    <Cinnabun.Suspense promise={loadCommunity} cache>
      {(loading: boolean, community: CommunityData | undefined) => {
        if (loading) {
          return (
            <div className="page-body">
              <DefaultLoader />
            </div>
          )
        } else if (!community) {
          return (
            <div className="page-body">
              <div>Community not found 😢</div>
            </div>
          )
        }

        return (
          <>
            <div className="page-title flex-column">
              <h2>{community.title}</h2>
              {community.description && <p className="text-muted">{community.description}</p>}
            </div>
            <div className="page-body">
              <div className="community-page-inner">
                <section className="flex flex-column community-page-posts">
                  <div className="section-title">
                    <h3>Posts</h3>
                    <Button
                      className="btn btn-primary hover-animate"
                      onclick={() => (postCreatorModalOpen.value = true)}
                      watch={userStore}
                      bind:disabled={isNotAuthenticated}
                    >
                      Create post
                    </Button>
                  </div>
                  <CommunityPosts posts={community.posts} />
                </section>
                <section className="flex flex-column community-page-members">
                  <div className="section-title">
                    <h3>Owner</h3>
                  </div>
                  <div className="flex flex-row">
                    <CommunityMemberCard member={community.owner} />
                  </div>
                  <div className="section-title">
                    <h3>Members</h3>
                  </div>
                  <div className="flex flex-row">
                    {community.members.map((member) => (
                      <CommunityMemberCard member={member} />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>
        )
      }}
    </Cinnabun.Suspense>
  )
}
