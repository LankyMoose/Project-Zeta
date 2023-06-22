import * as Cinnabun from "cinnabun"
import { PropsWithChildren } from "cinnabun/types"
import "./IconButton.css"

export const IconButton = ({ children, ...rest }: PropsWithChildren) => {
  return (
    <button className="icon-button" {...rest}>
      {children}
    </button>
  )
}
