import * as Cinnabun from "cinnabun"
import { sidebarOpen } from "../../state/global"
import { Button } from "./Button"
import { MenuIcon } from "./icons/MenuIcon"

export const MenuButton = ({ className }: { className?: string }) => {
  return (
    <Button
      className={`icon-button menu-button ${className}`}
      onclick={() => (sidebarOpen.value = !sidebarOpen.value)}
    >
      <MenuIcon />
    </Button>
  )
}
