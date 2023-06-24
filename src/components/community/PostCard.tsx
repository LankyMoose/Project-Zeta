import * as Cinnabun from "cinnabun"
import { Post } from "../../db/schema"
import { truncateText } from "../../utils"

export const PostCard = ({ post }: { post: Post }) => {
  return (
    <div className="card flex flex-column" key={post.id}>
      <div className="flex justify-content-between gap">
        <h4 className="m-0">{post.title}</h4>
        <small className="text-muted">
          {post.ownerId} | {post.createdAt}
        </small>
      </div>
      <div>{truncateText(post.content, 80)}</div>
    </div>
  )
}
