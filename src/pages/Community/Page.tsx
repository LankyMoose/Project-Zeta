import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import "./Page.css"
import { getCommunity } from "../../client/actions/communities"
import { DefaultLoader } from "../../components/loaders/Default"
import { setPath } from "cinnabun/router"
import {
  authModalOpen,
  authModalState,
  communityEditorModalOpen,
  communityJoinModalOpen,
  isCommunityMember,
  isCommunityOwner,
  pathStore,
  postCreatorModalOpen,
  selectedCommunity,
  userStore,
} from "../../state"
import { CommunityPosts } from "../../components/community/CommunityPosts"
import { CommunityData } from "../../types/community"
import { Button } from "../../components/Button"
import { CommunityMemberCard } from "../../components/community/CommunityMemberCard"
import { IconButton } from "../../components/IconButton"
import { EditIcon } from "../../components/icons"
import { SlideInOut } from "cinnabun-transitions"
import { AuthModalCallback } from "../../types/auth"

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

  const hasScrolled = createSignal(false)

  const onScroll = () => {
    if (hasScrolled.value && window.scrollY > 100) return
    hasScrolled.value = window.scrollY > 100
  }

  const onMounted = () => {
    window.addEventListener("scroll", onScroll)
  }
  const onUnmounted = () => {
    window.removeEventListener("scroll", onScroll)
  }

  const handleAddNewPost = () => {
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to create a Post",
        message: "You must be logged in to create a Post.",
        callbackAction: AuthModalCallback.CreatePost,
      }
      authModalOpen.value = true
      return
    }
    if (!isCommunityMember()) {
      communityJoinModalOpen.value = true
      return
    }
    postCreatorModalOpen.value = true
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
          <div onMounted={onMounted} onUnmounted={onUnmounted} className="page-wrapper">
            <div className="page-title">
              <div className="flex gap align-items-center">
                <h2>{community.title}</h2>
                {isCommunityOwner() ? (
                  <IconButton onclick={() => (communityEditorModalOpen.value = true)}>
                    <EditIcon color="var(--primary)" />
                  </IconButton>
                ) : (
                  <></>
                )}
              </div>
            </div>
            <SlideInOut
              className="community-page-fixed-title flex justify-content-between align-items-center"
              settings={{ from: "top" }}
              watch={hasScrolled}
              bind:visible={() => hasScrolled.value}
            >
              <div className="flex gap">
                <h2 className="m-0">{community.title}</h2>
                {isCommunityOwner() ? (
                  <IconButton onclick={() => (communityEditorModalOpen.value = true)}>
                    <EditIcon color="var(--primary)" />
                  </IconButton>
                ) : (
                  <></>
                )}
              </div>
              <Button
                className="btn sm_btn-sm btn-primary hover-animate flex align-items-center nowrap"
                onclick={handleAddNewPost}
              >
                Create post
              </Button>
            </SlideInOut>

            <div className="page-body">
              <div className="community-page-inner">
                <section className="flex flex-column community-page-posts">
                  <div className="section-title">
                    <h3>Posts</h3>
                    <Button
                      className="btn btn-primary hover-animate"
                      onclick={handleAddNewPost}
                      watch={userStore}
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
                  <div className="flex flex-column">
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
