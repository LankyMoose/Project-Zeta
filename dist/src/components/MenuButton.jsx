import * as Cinnabun from "cinnabun";
import { sidebarOpen } from "../state";
import { Button } from "./Button";
import { MenuIcon } from "./icons/MenuIcon";
export const MenuButton = ({ className }) => {
    return (<Button className={`icon-button menu-button ${className}`} onclick={() => (sidebarOpen.value = !sidebarOpen.value)}>
      <MenuIcon />
    </Button>);
};