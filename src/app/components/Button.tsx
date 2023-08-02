import * as Cinnabun from "cinnabun"
import { ComponentChildren, ComponentProps } from "cinnabun/types"

export const Button = (props: ComponentProps, children: ComponentChildren) => {
  return (
    <button {...props}>
      <span className="flex align-items-center gap-sm">{children}</span>
    </button>
  )
}
