import * as Cinnabun from "cinnabun"
import { PropsWithChildren } from "cinnabun/types"
import "./IconButton.css"

export const IconButton = ({ children, ...rest }: PropsWithChildren) => {
  const { className, ...others } = rest
  const _className = "icon-button " + (rest.className ?? "")
  return (
    <button className={_className} {...others}>
      {children}
    </button>
  )
}
