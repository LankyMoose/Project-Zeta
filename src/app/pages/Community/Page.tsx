import * as Cinnabun from "cinnabun"
import "./Page.css"
import { getCommunity } from "../../../client/actions/communities"
import { authModalOpen, authModalState, pathStore, userStore } from "../../state/global"
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
import { CommunityData } from "../../../types/community"
import { CommunityMemberCard } from "../../components/community/CommunityMemberCard"
import { IconButton } from "../../components/IconButton"
import { EditIcon } from "../../components/icons"

import { CommunityFixedHeader } from "../../components/community/CommunityFixedHeader"
import { AddPostButton } from "../../components/community/AddPostButton"
import { addNotification } from "../../components/Notifications"
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
  query: { createpost?: string }
}) {
  if (!params?.url_title) return setPath(pathStore, "/communities")
  selectedCommunityUrlTitle.value = params.url_title
  title.value = params.url_title + " | Project Zeta"

  const showLoginPrompt = () => {
    if (authModalOpen.value) return
    authModalState.value = {
      title: "Log in to view this community",
      message:
        "This community is private and you must be a member of the community to view its content.",
      callbackState: {
        view: {
          community: params.url_title,
        },
      },
    }
    authModalOpen.value = true
  }

  const handleError = (message: string) => {
    switch (message) {
      case API_ERROR.UNAUTHORIZED:
        if (userStore.value) {
          communityJoinModalOpen.value = true
        } else {
          showLoginPrompt()
        }
        return
      case API_ERROR.NOT_AUTHENTICATED:
        showLoginPrompt()
        return
      case API_ERROR.NSFW:
        if (selectedCommunity.value === null) selectedCommunity.value = {} as Partial<CommunityData>
        selectedCommunity.value.nsfw = true

        if (userStore.value) {
          communityNsfwAgreementModalOpen.value = true
        } else {
          showLoginPrompt()
        }
        return
      default:
        addNotification({
          type: "error",
          text: message,
        })
        console.log("unhandled case", message)
        setPath(pathStore, "/communities")
        break
    }
  }

  const loadCommunity = async (): Promise<Partial<CommunityData> | void> => {
    const res = await getCommunity(params.url_title!)
    if ("message" in res) {
      handleError(res.message)
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
    return res
  }

  const onMounted = () => {
    if (query.createpost) {
      postCreatorModalOpen.value = true
      window.history.pushState(null, "", window.location.pathname)
    }
  }

  const onBeforeUnmounted = () => {
    selectedCommunity.value = null
    selectedCommunityUrlTitle.value = null
    return true
  }

  return (
    <div onBeforeUnmounted={onBeforeUnmounted}>
      <Cinnabun.Suspense promise={loadCommunity} cache>
        {(loading: boolean, data?: Partial<CommunityData>) => {
          return (
            <div className="page-wrapper">
              <div className="page-title">
                <div className="flex gap align-items-center">
                  <h1 watch={selectedCommunity} bind:children>
                    {() =>
                      selectedCommunity.value?.title || (
                        <SkeletonElement tag="p" style="min-height: 50px; min-width:50vw" />
                      )
                    }
                  </h1>
                  {isCommunityOwner() ? (
                    <IconButton onclick={() => (communityEditorModalOpen.value = true)}>
                      <EditIcon color="var(--primary)" />
                    </IconButton>
                  ) : (
                    <></>
                  )}
                  {isCommunityAdmin() ? <AdminMenu /> : <></>}
                </div>
                <SkeletonElement
                  watch={selectedCommunity}
                  bind:visible={() => !selectedCommunity.value?.description}
                  tag="p"
                  style="min-height:1.5rem;margin-bottom:1rem; max-width: 70vw;"
                />
                <p watch={selectedCommunity} bind:children className="page-description">
                  {() => selectedCommunity.value?.description ?? ""}
                </p>
              </div>

              <CommunityFixedHeader />

              {isCommunityMember() && !isCommunityOwner() ? (
                <Button
                  className="btn btn-danger hover-animate btn-sm"
                  onclick={() => (communityLeaveModalOpen.value = true)}
                >
                  Leave this community
                </Button>
              ) : (
                <></>
              )}

              {!loading && !data ? (
                selectedCommunity.value?.nsfw ? (
                  <Button
                    className="btn btn-primary hover-animate btn-lg"
                    onclick={() => (communityNsfwAgreementModalOpen.value = true)}
                  >
                    View the community NSFW agreement
                  </Button>
                ) : (
                  <Button
                    className="btn btn-primary hover-animate btn-lg"
                    onclick={showLoginPrompt}
                  >
                    Log in to view this community
                  </Button>
                )
              ) : (
                <div onMounted={onMounted} className="page-body">
                  <div className="community-page-inner">
                    <section className="flex flex-column community-page-posts">
                      <div className="section-title">
                        <h3>Posts</h3>
                        {!loading && !!data ? (
                          <AddPostButton />
                        ) : (
                          <SkeletonElement tag="p" style="min-height: 2rem; min-width:100px" />
                        )}
                      </div>

                      <CommunityPosts url_title={params.url_title} />
                    </section>
                    <section
                      watch={selectedCommunity}
                      bind:children
                      className="flex flex-column community-page-members"
                    >
                      <div className="section-title">
                        <h3>Owner</h3>
                      </div>
                      {() =>
                        selectedCommunity.value?.owners && selectedCommunity.value.owners[0] ? (
                          <div className="flex flex-column mb-3">
                            <CommunityMemberCard member={selectedCommunity.value.owners[0]} />
                          </div>
                        ) : (
                          <div className="flex flex-column mb-3">
                            <SkeletonElement tag="p" style="min-height: 80px;" />
                          </div>
                        )
                      }
                      {loading || !data ? (
                        <div className="flex flex-column mb-3 gap">
                          <SkeletonElement tag="p" style="min-height: 80px;" />
                          <SkeletonElement tag="p" style="min-height: 80px;" />
                          <SkeletonElement tag="p" style="min-height: 80px;" />
                        </div>
                      ) : (
                        <>
                          {() =>
                            (selectedCommunity.value?.moderators ?? []).length > 0 ? (
                              <>
                                <div className="section-title">
                                  <h3>Moderators</h3>
                                </div>
                                <div className="flex flex-column">
                                  {(selectedCommunity.value?.moderators ?? []).map((member) => (
                                    <CommunityMemberCard member={member} />
                                  ))}
                                </div>
                              </>
                            ) : (
                              <></>
                            )
                          }
                          {() =>
                            (selectedCommunity.value?.members ?? []).length > 0 ? (
                              <>
                                <div className="section-title">
                                  <h3>Members</h3>
                                </div>
                                <div className="flex flex-column">
                                  {(selectedCommunity.value?.members ?? []).map((member) => (
                                    <CommunityMemberCard member={member} />
                                  ))}
                                </div>
                              </>
                            ) : (
                              <></>
                            )
                          }
                        </>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </div>
          )
        }}
      </Cinnabun.Suspense>
    </div>
  )
}
