import * as Cinnabun from "cinnabun"
import { PropsWithChildren } from "cinnabun/types"

export const PageBody = (props: PropsWithChildren) => {
  const { className, children, ...rest } = props
  return (
    <div className={`page-body flex gap flex-wrap ${className || ""}`} {...rest}>
      {children}
    </div>
  )
}
