import * as Cinnabun from "cinnabun"
import type { Community } from "../../db/schema"
import { truncateText } from "../../utils"
import { setPath } from "cinnabun/router"
import { pathStore } from "../../state"

export const CommunityListCard = (props: Community) => (
  <div
    className="card"
    key={props.id}
    onclick={() => setPath(pathStore, `/communities/${props.id}`)}
  >
    <h3 className="card-title">{props.title}</h3>
    <p>{truncateText(props.description, 128)}</p>
  </div>
)
