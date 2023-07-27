import * as Cinnabun from "cinnabun";
import { For } from "cinnabun";
import { CommunityListCard } from "./CommunityListCard";
export const CommunityList = ({ communities }) => {
    return (<ul className="card-list w-100">
      <For each={communities} template={(community) => <CommunityListCard {...community}/>}/>
    </ul>);
};
