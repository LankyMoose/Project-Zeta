import * as Cinnabun from "cinnabun";
import "./Page.css";
import { getCommunity } from "../../client/actions/communities";
import { DefaultLoader } from "../../components/loaders/Default";
import { setPath } from "cinnabun/router";
import { authModalOpen, authModalState, communityDeleteModalOpen, communityEditorModalOpen, communityJoinModalOpen, communityLeaveModalOpen, isCommunityAdmin, isCommunityMember, isCommunityOwner, pathStore, selectedCommunity, userStore, } from "../../state";
import { CommunityPosts } from "../../components/community/CommunityPosts";
import { CommunityMemberCard } from "../../components/community/CommunityMemberCard";
import { IconButton } from "../../components/IconButton";
import { EditIcon } from "../../components/icons";
import { CommunityFixedHeader } from "../../components/community/CommunityFixedHeader";
import { AddPostButton } from "../../components/community/AddPostButton";
import { addNotification } from "../../components/Notifications";
import { AuthModalCallback } from "../../types/auth";
import { Button } from "../../components/Button";
import { PendingJoinRequestsButton } from "../../components/community/PendingJoinRequestsButton";
export default function CommunityPage({ params }) {
    if (!params?.url_title)
        return setPath(pathStore, "/communities");
    const showLoginPrompt = () => {
        authModalState.value = {
            title: "Log in to view this community",
            message: "This community is private and you must be a member of the community to view its content.",
            callbackAction: AuthModalCallback.ViewCommunity,
        };
        authModalOpen.value = true;
    };
    const loadCommunity = async () => {
        const res = await getCommunity(params.url_title);
        if ("message" in res) {
            addNotification({
                type: "error",
                text: res.message,
            });
            setPath(pathStore, "/communities");
            return res;
        }
        if (!canViewCommunityData(res)) {
            if (userStore.value) {
                communityJoinModalOpen.value = true;
            }
            else {
                showLoginPrompt();
            }
        }
        selectedCommunity.value = {
            id: res.id,
            title: res.title,
            url_title: params.url_title,
            description: res.description,
            disabled: res.disabled,
            private: res.private,
            createdAt: res.createdAt,
            memberType: res.memberType,
            members: res.members,
            owners: res.owners,
            posts: res.posts,
            moderators: res.moderators,
        };
        return res;
    };
    const canViewCommunityData = (data) => {
        return !data.private || (data.memberType && data.memberType !== "guest");
    };
    return (<Cinnabun.Suspense promise={loadCommunity} cache>
      {(loading, data) => {
            if (data && "message" in data)
                return data.message;
            return (<div className="page-wrapper">
            <div className="page-title">
              <div className="flex gap align-items-center">
                <h1 watch={selectedCommunity} bind:children>
                  {() => selectedCommunity.value?.title}
                </h1>
                {isCommunityOwner() ? (<IconButton onclick={() => (communityEditorModalOpen.value = true)}>
                    <EditIcon color="var(--primary)"/>
                  </IconButton>) : (<></>)}
                {isCommunityAdmin() ? (<div className="ml-auto">
                    <PendingJoinRequestsButton />
                  </div>) : (<></>)}
              </div>
              <p watch={selectedCommunity} bind:children className="page-description">
                {() => selectedCommunity.value?.description ?? ""}
              </p>
            </div>

            {loading ? (<div className="page-body">
                <DefaultLoader />
              </div>) : canViewCommunityData(data) ? (<>
                <CommunityFixedHeader />

                {isCommunityOwner() ? (<>
                    <div className="flex gap">
                      <Button className="btn btn-danger hover-animate btn-sm" onclick={() => (communityDeleteModalOpen.value = true)}>
                        Delete this community
                      </Button>
                      <Button className="btn btn-primary hover-animate btn-sm" onclick={() => (communityLeaveModalOpen.value = true)}>
                        Transfer ownership
                      </Button>
                    </div>
                    <br />
                  </>) : isCommunityMember() ? (<>
                    <div>
                      <Button className="btn btn-danger hover-animate btn-sm" onclick={() => (communityLeaveModalOpen.value = true)}>
                        Leave this community
                      </Button>
                    </div>
                    <br />
                  </>) : (<> </>)}

                <div className="page-body">
                  <div className="community-page-inner">
                    <section className="flex flex-column community-page-posts">
                      <div className="section-title">
                        <h3>Posts</h3>
                        <AddPostButton />
                      </div>
                      <CommunityPosts posts={data.posts ?? []}/>
                    </section>
                    <section className="flex flex-column community-page-members">
                      {data.owners && data.owners[0] ? (<>
                          <div className="section-title">
                            <h3>Owner</h3>
                          </div>
                          <div className="flex flex-column mb-3">
                            <CommunityMemberCard member={data.owners[0]}/>
                          </div>
                        </>) : (<></>)}
                      {data.members ? (<>
                          <div className="section-title">
                            <h3>Members</h3>
                          </div>
                          <div className="flex flex-column">
                            {data.members.map((member) => (<CommunityMemberCard member={member}/>))}
                          </div>
                        </>) : (<></>)}
                    </section>
                  </div>
                </div>
              </>) : userStore.value ? (<Button className="btn btn-primary hover-animate btn-lg" onclick={() => (communityJoinModalOpen.value = true)}>
                Join to view this community
              </Button>) : (<Button className="btn btn-primary hover-animate btn-lg" onclick={showLoginPrompt}>
                Log in to view this community
              </Button>)}
          </div>);
        }}
    </Cinnabun.Suspense>);
}
