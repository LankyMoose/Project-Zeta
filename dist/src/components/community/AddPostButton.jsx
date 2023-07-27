import * as Cinnabun from "cinnabun";
import { authModalOpen, authModalState, communityJoinModalOpen, isCommunityMember, postCreatorModalOpen, userStore, } from "../../state";
import { Button } from "../Button";
import { AuthModalCallback } from "../../types/auth";
export const AddPostButton = () => {
    const handleAddNewPost = () => {
        if (!userStore.value) {
            authModalState.value = {
                title: "Log in to create a Post",
                message: "You must be logged in to create a Post.",
                callbackAction: AuthModalCallback.CreatePost,
            };
            authModalOpen.value = true;
            return;
        }
        if (!isCommunityMember()) {
            communityJoinModalOpen.value = true;
            return;
        }
        postCreatorModalOpen.value = true;
    };
    return (<Button className="btn btn-primary hover-animate" onclick={handleAddNewPost} watch={userStore}>
      Create post
    </Button>);
};
