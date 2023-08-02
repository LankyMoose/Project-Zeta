import * as Cinnabun from "cinnabun"
import { SkeletonElement } from "../SkeletonElement"

export const SkeletonList = ({
  numberOfItems,
  className,
  height = "100px",
}: {
  numberOfItems: number
  className?: string
  height?: string
}) => {
  return (
    <ul className={`w-100 m-0 p-0 ${className}`}>
      {Array.from({ length: numberOfItems }).map(() => (
        <SkeletonElement tag="div" className="card w-100" style={{ minHeight: height }} />
      ))}
    </ul>
  )
}
