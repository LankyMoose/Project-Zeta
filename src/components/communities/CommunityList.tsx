import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import { CommunityListCard } from "./CommunityListCard"
import type { CommunityListData } from "../../types/community"

export const CommunityList = ({ communities }: { communities: CommunityListData[] }) => {
  console.log("CommunityList", communities)
  return (
    <ul className="card-list w-100">
      <For each={communities} template={(community) => <CommunityListCard {...community} />} />
    </ul>
  )
}
