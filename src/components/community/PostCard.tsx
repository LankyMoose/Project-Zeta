import * as Cinnabun from "cinnabun"
import { createSignal, computed } from "cinnabun"
import { truncateText } from "../../utils"
import { CommunityPostData } from "../../types/post"
import { IconButton } from "../IconButton"
import { ThumbsUpIcon } from "../icons/ThumbsUpIcon"
import { ThumbsDownIcon } from "../icons/ThumbsDownIcon"
import "./PostCard.css"
import { addPostReaction } from "../../client/actions/posts"
import { isNotAuthenticated, userStore } from "../../state"

export const PostCard = ({ post }: { post: CommunityPostData }) => {
  const state = createSignal(post)

  const addReaction = async (reaction: boolean) => {
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
  }

  // get total positive / negative reactions

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
        <h4 className="m-0 title">{post.title}</h4>
        <small className="author text-muted">
          <span>{post.user.name}</span>
          <span className="created-at">{new Date(post.createdAt).toLocaleString()}</span>
        </small>
      </div>
      <p className="post-card-content">{truncateText(post.content, 256)}</p>
      <div className="flex gap">
        <IconButton
          onclick={() => addReaction(true)}
          className="rounded-lg flex align-items-center gap-sm"
          watch={userStore}
          bind:disabled={isNotAuthenticated}
        >
          <ThumbsUpIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-lg"
          />
          <small className="text-muted" watch={totalReactions} bind:children>
            {() => totalReactions.value.positive}
          </small>
        </IconButton>
        <IconButton
          onclick={() => addReaction(false)}
          className="rounded-lg flex align-items-center gap-sm"
          watch={userStore}
          bind:disabled={isNotAuthenticated}
        >
          <ThumbsDownIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-lg"
          />
          <small className="text-muted" watch={totalReactions} bind:children>
            {() => totalReactions.value.negative}
          </small>
        </IconButton>
      </div>
    </div>
  )
}
