import * as Cinnabun from "cinnabun"
import { truncateText } from "../../utils"
import { CommunityPostData } from "../../types/post"
import { IconButton } from "../IconButton"
import { ThumbsUpIcon } from "../icons/ThumbsUpIcon"
import { ThumbsDownIcon } from "../icons/ThumbsDownIcon"
import "./PostCard.css"

export const PostCard = ({ post }: { post: CommunityPostData }) => {
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
      <div>
        <IconButton className="rounded-lg">
          <ThumbsUpIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-lg"
          />
        </IconButton>
        <IconButton className="rounded-lg">
          <ThumbsDownIcon
            color="var(--primary)"
            color:hover="var(--primary-light)"
            className="text-lg"
          />
        </IconButton>
      </div>
    </div>
  )
}
