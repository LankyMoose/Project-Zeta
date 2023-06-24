import * as Cinnabun from "cinnabun"
import type { Community } from "../../db/schema"
import { truncateText } from "../../utils"

export const CommunityListCard = (props: Community) => (
  <div key={props.id}>
    <h3>{props.title}</h3>
    <p>{truncateText(props.description, 128)}</p>
  </div>
)
