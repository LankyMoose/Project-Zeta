import * as Cinnabun from "cinnabun"
import { formatUTCDate } from "../utils"
import { Link } from "cinnabun/router"
import { pathStore } from "../state/global"

export const AuthorTag = ({
  user,
  date,
}: {
  user: {
    id: string
    name: string
    avatarUrl: string | undefined | null
  }
  date?: string
}) => {
  return (
    <small className="author text-muted">
      <div className="flex flex-column">
        <Link to={`/users/${user.id}`} store={pathStore}>
          {user.name}
        </Link>
        {date ? <span className="created-at">{formatUTCDate(date.toString())}</span> : <></>}
      </div>

      <div className="avatar-wrapper sm">
        <img src={user.avatarUrl} className="avatar" alt={user.name} />
      </div>
    </small>
  )
}
