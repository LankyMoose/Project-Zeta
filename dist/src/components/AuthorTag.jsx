import * as Cinnabun from "cinnabun";
import { formatUTCDate } from "../utils";
export const AuthorTag = ({ user, date, }) => {
    return (<small className="author text-muted">
      <div className="flex flex-column">
        <span>{user.name}</span>
        {date ? <span className="created-at">{formatUTCDate(date.toString())}</span> : <></>}
      </div>

      <div className="avatar-wrapper sm">
        <img src={user.avatarUrl} className="avatar" alt={user.name}/>
      </div>
    </small>);
};
