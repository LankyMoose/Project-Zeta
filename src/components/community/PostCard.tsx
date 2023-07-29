import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { setPath } from "cinnabun/router"
import { truncateText } from "../../utils"
import { CommunityPostData } from "../../types/post"
import { IconButton } from "../IconButton"
import { ThumbsUpIcon } from "../icons/ThumbsUpIcon"
import { ThumbsDownIcon } from "../icons/ThumbsDownIcon"
import { addPostReaction } from "../../client/actions/posts"
import { isCommunityMember, communityJoinModalOpen, selectedCommunity } from "../../state/community"
import { userStore, authModalState, authModalOpen, pathStore } from "../../state/global"

import { PostCardComments } from "./PostCardComments"
import { AuthorTag } from "../AuthorTag"
import "./PostCard.css"
import { AuthModalCallback } from "../../types/auth"

export const PostCard = ({ post }: { post: CommunityPostData }) => {
  post.comments.sort((a, b) => {
    const aDate = new Date(a.createdAt)
    const bDate = new Date(b.createdAt)
    if (aDate > bDate) return 1
    if (aDate < bDate) return -1
    return 0
  })
  const state = createSignal(post)
  const reacting = createSignal(false)

  const addReaction = async (reaction: boolean) => {
    if (reacting.value) return
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to interact with this post",
        message: "You must be logged in to interact with community posts.",
        callbackAction: AuthModalCallback.ViewCommunity,
      }
      authModalOpen.value = true
      return
    }
    if (!isCommunityMember()) {
      communityJoinModalOpen.value = true
      return
    }

    reacting.value = true
    const res = await addPostReaction(post.id, reaction)
    if (res) {
      if (state.value.userReaction === true) {
        state.value.reactions.positive--
      } else if (state.value.userReaction === false) {
        state.value.reactions.negative--
      }
      if (reaction === true) {
        state.value.reactions.positive++
      } else {
        state.value.reactions.negative++
      }
      state.value.userReaction = reaction
      state.notify()
    }
    reacting.value = false
  }

  return (
    <div className="card post-card flex flex-column" key={post.id}>
      <div className="flex justify-content-between gap">
        <h4 className="m-0 title">
          <a
            href={`/communities/${selectedCommunity.value?.url_title}/${post.id}`}
            onclick={(e: Event) => {
              e.preventDefault()
              setPath(pathStore, `/communities/${selectedCommunity.value?.url_title}/${post.id}`)
            }}
          >
            {post.title}
          </a>
        </h4>
        <AuthorTag user={post.user} date={post.createdAt.toString()} />
      </div>
      <p className="post-card-content">{truncateText(post.content, 256)}</p>
      <div className="flex gap post-reactions">
        <IconButton
          onclick={() => addReaction(true)}
          bind:className={() =>
            `icon-button flex align-items-center gap-sm ${
              state.value?.userReaction === true ? "selected" : ""
            }`
          }
          watch={[userStore, reacting, state]}
          bind:disabled={() => reacting.value}
        >
          <ThumbsUpIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-rg"
          />
          <small className="text-muted" watch={state} bind:children>
            {() => state.value.reactions.positive ?? 0}
          </small>
        </IconButton>
        <IconButton
          onclick={() => addReaction(false)}
          bind:className={() =>
            `icon-button flex align-items-center gap-sm ${
              state.value?.userReaction === false ? "selected" : ""
            }`
          }
          watch={[userStore, reacting, state]}
          bind:disabled={() => reacting.value}
        >
          <ThumbsDownIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-rg"
          />
          <small className="text-muted" watch={state} bind:children>
            {() => state.value.reactions.negative ?? 0}
          </small>
        </IconButton>
      </div>
      <PostCardComments post={state} />
    </div>
  )
}
