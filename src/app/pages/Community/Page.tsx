import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import "./Page.css"
import { getCommunity } from "../../../client/actions/communities"
import { authModalOpen, authModalState, pathStore } from "../../state/global"
import {
  communityEditorModalOpen,
  communityJoinModalOpen,
  communityLeaveModalOpen,
  communityNsfwAgreementModalOpen,
  isCommunityAdmin,
  isCommunityMember,
  isCommunityOwner,
  postCreatorModalOpen,
  selectedCommunity,
  selectedCommunityUrlTitle,
} from "../../state/community"
import { CommunityPosts } from "../../components/community/CommunityPosts"
import { CommunityMemberCard } from "../../components/community/CommunityMemberCard"
import { IconButton } from "../../components/icons/IconButton"
import { EditIcon } from "../../components/icons"

import { CommunityFixedHeader } from "../../components/community/CommunityFixedHeader"
import { AddPostButton } from "../../components/community/AddPostButton"
import { addNotification } from "../../components/notifications/Notifications"
import { Button } from "../../components/Button"
import { AdminMenu } from "../../components/community/AdminMenu/AdminMenu"
import { setPath } from "cinnabun/router"
import { title } from "../../Document"
import { API_ERROR } from "../../../constants"
import { SkeletonElement } from "../../components/loaders/SkeletonElement"

export default function CommunityPage({
  params,
  query,
}: {
  params?: { url_title?: string }
  query: { newpost?: string }
}) {
  if (!params?.url_title) return setPath(pathStore, "/communities")
  selectedCommunityUrlTitle.value = params.url_title
  title.value = params.url_title + " | Project Zeta"
  const loading = createSignal(true)
  const loaded = createSignal(false)
  const errorMessage = createSignal<API_ERROR | undefined>(undefined)

  const showLoginPrompt = () => {
    if (authModalOpen.value) return
    authModalState.value = {
      title: "Log in to view this community",
      message:
        "This community is private and you must be a member of the community to view its content.",
      callbackState: {
        community: params.url_title,
      },
    }
    authModalOpen.value = true
  }

  const handleError = (message: string) => {
    switch (message) {
      case API_ERROR.UNAUTHORIZED:
        communityJoinModalOpen.value = true
        errorMessage.value = message
        break
      case API_ERROR.NOT_AUTHENTICATED:
        showLoginPrompt()
        errorMessage.value = message
        break
      case API_ERROR.NSFW:
        communityNsfwAgreementModalOpen.value = true
        errorMessage.value = message
        break
      default:
        addNotification({
          type: "error",
          text: message,
        })
        console.log("unhandled case", message)
        setPath(pathStore, "/communities")
        break
    }
    console.log("error", message)
  }

  const loadCommunity = async () => {
    loading.value = true
    const res = await getCommunity(params.url_title!)
    if ("message" in res) {
      handleError(res.message)
      loading.value = false
      return
    }

    title.value = res.title + " | Project Zeta"
    selectedCommunity.value = {
      id: res.id,
      title: res.title,
      url_title: params.url_title!,
      description: res.description,
      disabled: res.disabled,
      private: res.private,
      createdAt: res.createdAt,
      memberType: res.memberType,
      members: res.members,
      owners: res.owners,
      moderators: res.moderators,
      nsfw: res.nsfw,
    }
    loaded.value = true
    loading.value = false

    console.log("query", query)

    if (query.newpost) {
      postCreatorModalOpen.value = true
      window.history.pushState(null, "", window.location.pathname)
    }
  }

  if (Cinnabun.Cinnabun.isClient) loadCommunity()

  const onBeforeUnmounted = () => {
    selectedCommunity.value = null
    selectedCommunityUrlTitle.value = null
    return true
  }

  return (
    <div onBeforeUnmounted={onBeforeUnmounted} className="page-wrapper">
      <div className="page-title">
        <div className="flex gap align-items-center">
          <h1 watch={[loading, selectedCommunity]} bind:children>
            {() =>
              loading.value && !selectedCommunity.value?.title ? (
                <SkeletonElement tag="p" style="min-height: 50px; min-width:50vw" />
              ) : selectedCommunity.value?.title ? (
                selectedCommunity.value.title
              ) : (
                ""
              )
            }
          </h1>
          <IconButton
            watch={selectedCommunity}
            bind:visible={() => isCommunityOwner()}
            onclick={() => (communityEditorModalOpen.value = true)}
          >
            <EditIcon color="var(--primary)" />
          </IconButton>
          <div className="ml-auto" watch={selectedCommunity} bind:children>
            {() => (isCommunityAdmin() ? <AdminMenu /> : <></>)}
          </div>
        </div>
        <div watch={[loading, selectedCommunity]} bind:children>
          {() =>
            loading.value && !selectedCommunity.value?.description ? (
              <>
                <SkeletonElement
                  tag="p"
                  className="page-description"
                  style="min-height:1.5rem;margin-bottom:1rem; max-width: 70vw;"
                />
                <SkeletonElement
                  tag="p"
                  className="page-description"
                  style="min-height:1.5rem;margin-bottom:1rem; max-width: 60vw;"
                />
              </>
            ) : (
              <p className="page-description">{selectedCommunity.value?.description}</p>
            )
          }
        </div>
      </div>

      <CommunityFixedHeader />

      <div watch={loading} bind:children>
        {() =>
          isCommunityMember() && !isCommunityOwner() ? (
            <Button
              className="btn btn-danger hover-animate btn-sm"
              onclick={() => (communityLeaveModalOpen.value = true)}
            >
              Leave this community
            </Button>
          ) : (
            <></>
          )
        }
      </div>
      <div watch={[loading, errorMessage]} bind:children>
        {() =>
          errorMessage.value === API_ERROR.NSFW ? (
            <Button
              className="btn btn-primary hover-animate btn-lg"
              onclick={() => (communityNsfwAgreementModalOpen.value = true)}
            >
              View the community NSFW agreement
            </Button>
          ) : errorMessage.value === API_ERROR.NOT_AUTHENTICATED ? (
            <Button className="btn btn-primary hover-animate btn-lg" onclick={showLoginPrompt}>
              Log in to view this community
            </Button>
          ) : errorMessage.value === API_ERROR.UNAUTHORIZED ? (
            <Button
              className="btn btn-primary hover-animate btn-lg"
              onclick={() => (communityJoinModalOpen.value = true)}
            >
              Join this community
            </Button>
          ) : (
            <></>
          )
        }
      </div>
      <div className="page-body">
        <div className="community-page-inner">
          <section className="flex flex-column community-page-posts">
            <div className="section-title" watch={[loading, loaded]} bind:children>
              {() =>
                loading.value ? (
                  <SkeletonElement tag="p" style="min-height: 2rem; min-width:100px" />
                ) : loaded.value ? (
                  <>
                    <h3>Posts</h3>
                    <AddPostButton />
                  </>
                ) : (
                  <></>
                )
              }
            </div>

            <CommunityPosts url_title={params.url_title} />
          </section>
          <section
            watch={[loading, selectedCommunity]}
            bind:children
            className="flex flex-column community-page-members"
          >
            {() =>
              loading.value ? (
                <>
                  <div className="section-title">
                    <SkeletonElement tag="p" style="min-width: 120px; min-height: 2rem;" />
                  </div>
                  <div className="flex flex-column mb-3">
                    <SkeletonElement tag="p" style="min-height: 94px;" />
                  </div>
                </>
              ) : selectedCommunity.value?.owners && selectedCommunity.value.owners[0] ? (
                <>
                  <div className="section-title">
                    <h3>Owner</h3>
                  </div>
                  <div className="flex flex-column mb-3">
                    <CommunityMemberCard member={selectedCommunity.value.owners[0]} />
                  </div>
                </>
              ) : (
                <></>
              )
            }

            <div
              watch={loading}
              bind:visible={() => loading.value}
              className="flex flex-column mb-3 gap"
            >
              <SkeletonElement tag="p" style="min-height: 94px;" />
              <SkeletonElement tag="p" style="min-height: 94px;" />
              <SkeletonElement tag="p" style="min-height: 94px;" />
            </div>
            <div
              watch={[loaded, selectedCommunity]}
              bind:visible={() =>
                loaded.value &&
                !!selectedCommunity.value?.moderators &&
                selectedCommunity.value.moderators.length > 0
              }
            >
              <div className="section-title">
                <h3>Moderators</h3>
              </div>
              <div className="flex flex-column mb-3 gap">
                {() =>
                  (selectedCommunity.value?.moderators ?? []).map((member) => (
                    <CommunityMemberCard member={member} />
                  ))
                }
              </div>
            </div>

            <div
              watch={[loaded, selectedCommunity]}
              bind:visible={() =>
                loaded.value &&
                !!selectedCommunity.value?.members &&
                selectedCommunity.value.members.length > 0
              }
            >
              <div className="section-title">
                <h3>Members</h3>
              </div>
              <div className="flex flex-column mb-3 gap">
                {() =>
                  (selectedCommunity.value?.members ?? []).map((member) => (
                    <CommunityMemberCard member={member} />
                  ))
                }
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
