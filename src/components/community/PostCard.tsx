import * as Cinnabun from "cinnabun"
import { truncateText } from "../../utils"
import { CommunityPostData } from "../../types/post"

export const PostCard = ({ post }: { post: CommunityPostData }) => {
  return (
    <div className="card flex flex-column" key={post.id}>
      <div className="flex justify-content-between gap">
        <h4 className="m-0">{post.title}</h4>
        <small className="text-muted">
          {post.user.name} | {post.createdAt}
        </small>
      </div>
      <div>{truncateText(post.content, 256)}</div>
    </div>
  )
}
