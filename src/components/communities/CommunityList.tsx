import * as Cinnabun from "cinnabun"
import { For } from "cinnabun"
import type { Community } from "../../db/schema"
import { CommunityListCard } from "./CommunityListCard"

export const CommunityList = ({
  communities,
}: {
  communities: Community[]
}) => {
  return (
    <For
      each={communities}
      template={(community) => <CommunityListCard {...community} />}
    />
  )
}
