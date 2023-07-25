import * as Cinnabun from "cinnabun"
import { sidebarOpen } from "../state"
import { Button } from "./Button"
import { MenuIcon } from "./icons/MenuIcon"

export const MenuButton = () => {
  return (
    <Button
      className="icon-button menu-button"
      onclick={() => (sidebarOpen.value = !sidebarOpen.value)}
    >
      <MenuIcon />
    </Button>
  )
}
