import * as Cinnabun from "cinnabun";
import { SlideInOut } from "cinnabun-transitions";
import { pathStore, userDropdownOpen } from "../state";
import { Link } from "cinnabun/router";
import "./UserDropdown.css";
export const UserDropdown = () => {
    return (<div className="user-dropdown-wrapper">
      <SlideInOut watch={userDropdownOpen} bind:visible={() => userDropdownOpen.value} settings={{ from: "top" }} className="user-dropdown">
        <div className="user-dropdown-item">
          <Link to="/users/me" store={pathStore}>
            Profile
          </Link>
        </div>
        <div className="user-dropdown-item">
          <Link to="/settings" store={pathStore}>
            Settings
          </Link>
        </div>
        <div className="user-dropdown-item">
          <a href="/logout">Log out</a>
        </div>
      </SlideInOut>
    </div>);
};
