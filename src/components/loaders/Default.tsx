import * as Cinnabun from "cinnabun"
import { ComponentProps } from "cinnabun/types"
import "./Default.css"
export const DefaultLoader = (props: ComponentProps) => {
  return (
    <div className="lds-default" {...props}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}
