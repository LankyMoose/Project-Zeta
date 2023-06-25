import * as Cinnabun from "cinnabun"
import type { Community } from "../../db/schema"
import { truncateText } from "../../utils"
import { setPath } from "cinnabun/router"
import { pathStore } from "../../state"
import "./CommunityListCard.css"

export const CommunityListCard = (props: Community) => (
  <div className="card community-card" key={props.id}>
    <h3 className="card-title">
      <a
        href={`/communities/${props.url_title}`}
        onclick={(e: Event) => {
          e.preventDefault()
          setPath(pathStore, `/communities/${props.url_title}`)
        }}
      >
        {props.title}
      </a>
    </h3>
    <p className="card-description text-muted">{truncateText(props.description, 128)}</p>
  </div>
)
