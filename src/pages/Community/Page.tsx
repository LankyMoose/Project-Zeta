import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import "./Page.css"
import { getCommunity } from "../../client/actions/communities"
import { DefaultLoader } from "../../components/loaders/Default"
import { setPath } from "cinnabun/router"
import {
  communityEditorModalOpen,
  isCommunityOwner,
  pathStore,
  selectedCommunity,
} from "../../state"
import { CommunityPosts } from "../../components/community/CommunityPosts"
import { CommunityData } from "../../types/community"
import { CommunityMemberCard } from "../../components/community/CommunityMemberCard"
import { IconButton } from "../../components/IconButton"
import { EditIcon } from "../../components/icons"

import { CommunityFixedHeader } from "../../components/community/CommunityFixedHeader"
import { AddPostButton } from "../../components/community/AddPostButton"

export default function CommunityPage({ params }: { params?: { url_title?: string } }) {
  if (!params?.url_title) return setPath(pathStore, "/communities")
  const state = createSignal<CommunityData | undefined>(undefined)
  const loadCommunity = async (): Promise<CommunityData | undefined> => {
    const res = await getCommunity(params.url_title!)
    if (!res) {
      setPath(pathStore, "/communities")
      return
    }
    state.value = res
    selectedCommunity.value = {
      id: res.id,
      title: res.title,
      url_title: params.url_title!,
      description: res.description,
      disabled: res.disabled,
      private: res.private,
      createdAt: res.createdAt,
      memberType: res.memberType,
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
          <div className="page-wrapper">
            <div className="page-title">
              <div className="flex gap align-items-center">
                <h1>{community.title}</h1>
                {isCommunityOwner() ? (
                  <IconButton onclick={() => (communityEditorModalOpen.value = true)}>
                    <EditIcon color="var(--primary)" />
                  </IconButton>
                ) : (
                  <></>
                )}
              </div>
              <p className="text-muted">{community.description}</p>
            </div>
            <CommunityFixedHeader />

            <div className="page-body">
              <div className="community-page-inner">
                <section className="flex flex-column community-page-posts">
                  <div className="section-title">
                    <h3>Posts</h3>
                    <AddPostButton />
                  </div>
                  <CommunityPosts posts={community.posts} />
                </section>
                <section className="flex flex-column community-page-members">
                  <div className="section-title">
                    <h3>Owner</h3>
                  </div>
                  <div className="flex flex-column mb-3">
                    <CommunityMemberCard member={community.owners[0]} />
                  </div>
                  <div className="section-title">
                    <h3>Members</h3>
                  </div>
                  <div className="flex flex-column">
                    {community.members.map((member) => (
                      <CommunityMemberCard member={member} />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )
      }}
    </Cinnabun.Suspense>
  )
}
