import * as Cinnabun from "cinnabun"
import { truncateText } from "../../utils"
import { setPath } from "cinnabun/router"
import { pathStore } from "../../state"
import "./CommunityListCard.css"
import type { CommunityListData } from "../../types/community"

export const CommunityListCard = (props: CommunityListData) => {
  const { members, community } = props

  const nMembers = parseInt(members)

  return (
    <div className="card community-card" key={community.id}>
      <div className="card-title flex justify-content-between">
        <h3 className="m-0">
          <a
            href={`/communities/${community.url_title}`}
            onclick={(e: Event) => {
              e.preventDefault()
              setPath(pathStore, `/communities/${community.url_title}`)
            }}
          >
            {community.title}
          </a>
        </h3>
        <small className="text-muted">
          {nMembers} {nMembers > 1 ? "members" : "member"}
        </small>
      </div>
      <p className="card-description text-muted">{truncateText(community.description, 128)}</p>
    </div>
  )
}
