import * as Cinnabun from "cinnabun"
import { PropsWithChildren } from "cinnabun/types"

export const PageTitle = (props: PropsWithChildren) => {
  const { className, children, ...rest } = props
  return (
    <div
      className={`page-title flex align-items-center justify-content-between gap flex-wrap ${
        className || ""
      }`}
      {...rest}
    >
      {children}
    </div>
  )
}
