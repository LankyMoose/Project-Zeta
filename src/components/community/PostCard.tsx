import * as Cinnabun from "cinnabun"
import { createSignal, computed } from "cinnabun"
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
  const userReaction = computed(state, () => {
    if (!userStore.value) return undefined
    return state.value.reactions.find((r) => r.ownerId === userStore.value?.userId)
  })

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
    if (userReaction.value?.reaction === reaction) return
    if (!isCommunityMember()) {
      communityJoinModalOpen.value = true
      return
    }

    reacting.value = true
    const res = await addPostReaction(post.id, reaction)
    if (res) {
      // find and remove previous reaction
      const prevReaction = state.value.reactions.find((r) => r.ownerId === userStore?.value?.userId)
      if (prevReaction) {
        state.value.reactions.splice(state.value.reactions.indexOf(prevReaction), 1)
      }

      state.value.reactions.push(res)
      state.notify()
    }
    reacting.value = false
  }

  const totalReactions = computed(state, () => {
    return state.value.reactions.reduce(
      (acc, reaction) => {
        if (reaction.reaction) {
          acc.positive++
        } else {
          acc.negative++
        }
        return acc
      },
      { positive: 0, negative: 0 }
    )
  })

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
              userReaction.value?.reaction === true ? "selected" : ""
            }`
          }
          watch={[userStore, reacting, userReaction]}
          bind:disabled={() => reacting.value}
        >
          <ThumbsUpIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-rg"
          />
          <small className="text-muted" watch={totalReactions} bind:children>
            {() => totalReactions.value.positive}
          </small>
        </IconButton>
        <IconButton
          onclick={() => addReaction(false)}
          bind:className={() =>
            `icon-button flex align-items-center gap-sm ${
              userReaction.value?.reaction === false ? "selected" : ""
            }`
          }
          watch={[userStore, reacting, userReaction]}
          bind:disabled={() => reacting.value}
        >
          <ThumbsDownIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-rg"
          />
          <small className="text-muted" watch={totalReactions} bind:children>
            {() => totalReactions.value.negative}
          </small>
        </IconButton>
      </div>
      <PostCardComments post={state} />
    </div>
  )
}
