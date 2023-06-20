import * as Cinnabun from "cinnabun"
import { ComponentProps } from "cinnabun/types"
import "./Ellipsis.css"

export const EllipsisLoader = (props: ComponentProps) => {
  return (
    <div className="lds-ellipsis" {...props}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}
