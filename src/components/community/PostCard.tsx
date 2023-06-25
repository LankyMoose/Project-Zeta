import * as Cinnabun from "cinnabun"
import { truncateText } from "../../utils"
import { CommunityPostData } from "../../types/post"
import { IconButton } from "../IconButton"
import { ThumbsUpIcon } from "../icons/ThumbsUpIcon"
import { ThumbsDownIcon } from "../icons/ThumbsDownIcon"
import "./PostCard.css"
import { addPostReaction } from "../../client/actions/posts"

export const PostCard = ({ post }: { post: CommunityPostData }) => {
  const addReaction = async (reaction: boolean) => {
    await addPostReaction(post.id, reaction)
  }

  // get total positive / negative reactions

  const totalReactions = post.reactions.reduce(
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
        >
          <ThumbsUpIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-lg"
          />
          <small className="text-muted">{totalReactions.positive}</small>
        </IconButton>
        <IconButton
          onclick={() => addReaction(false)}
          className="rounded-lg flex align-items-center gap-sm"
        >
          <ThumbsDownIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-lg"
          />
          <small className="text-muted">{totalReactions.negative}</small>
        </IconButton>
      </div>
    </div>
  )
}
