import * as Cinnabun from "cinnabun"
import { ComponentProps } from "cinnabun/types"
import "./Ellipsis.css"

export const EllipsisLoader = (props: ComponentProps) => {
  const { className, ...rest } = props
  return (
    <div className={`lds-ellipsis ${className}`} {...rest}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}
