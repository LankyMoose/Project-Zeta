import * as Cinnabun from "cinnabun"
import { Post } from "../../db/schema"
import { truncateText } from "../../utils"

export const PostCard = ({ post }: { post: Post }) => {
  return (
    <div className="card flex flex-column" key={post.id}>
      <div>{post.title}</div>
      <div>{truncateText(post.content, 80)}</div>
    </div>
  )
}
