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
      <Cinnabun.For
        each={Array.from({ length: numberOfItems })}
        template={(_item, idx) => (
          <SkeletonElement
            tag="div"
            key={idx.toString()}
            className="card w-100"
            style={{ minHeight: height }}
          />
        )}
      />
    </ul>
  )
}
