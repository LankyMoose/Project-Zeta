import * as Cinnabun from "cinnabun"
import { SkeletonElement } from "./SkeletonElement"
import { ComponentProps } from "cinnabun/types"

export const SkeletonList = ({
  numberOfItems,
  className,
  height = "100px",
  ...rest
}: {
  numberOfItems: number
  className?: string
  height?: string
} & ComponentProps) => {
  return (
    <ul {...rest} className={`w-100 m-0 p-0 ${className}`}>
      {Array.from({ length: numberOfItems }).map(() => (
        <SkeletonElement tag="div" className="card w-100" style={{ minHeight: height }} />
      ))}
    </ul>
  )
}
