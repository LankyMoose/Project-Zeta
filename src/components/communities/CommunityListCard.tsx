import * as Cinnabun from "cinnabun"
import { truncateText } from "../../utils"
import { setPath } from "cinnabun/router"
import { pathStore, selectedCommunity } from "../../state"
import "./CommunityListCard.css"
import type { CommunityListData } from "../../types/community"

export const CommunityListCard = (props: CommunityListData) => {
  const { members, community } = props

  const nMembers = parseInt(members.toString())

  return (
    <div className="card community-card" key={community.id}>
      <div className="card-title flex justify-content-between">
        <div className="flex gap align-items-center">
          <h2 className="m-0 line-height-1">
            <a
              href={`/communities/${community.url_title}`}
              onclick={(e: Event) => {
                e.preventDefault()
                selectedCommunity.value = {
                  id: community.id,
                  title: community.title,
                  url_title: community.url_title!,
                  description: community.description,
                  private: !!community.private,
                  disabled: !!community.disabled,
                }
                setPath(pathStore, `/communities/${community.url_title}`)
              }}
            >
              {community.title}
            </a>
          </h2>
          {community.private ? <span className="badge text-light">Private</span> : <></>}
        </div>
        <small className="text-muted">
          {nMembers} {nMembers > 1 ? "members" : "member"}
        </small>
      </div>
      <p className="card-description text-muted">{truncateText(community.description, 128)}</p>
    </div>
  )
}
