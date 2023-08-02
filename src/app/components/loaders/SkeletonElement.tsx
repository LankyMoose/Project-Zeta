import { Component } from "cinnabun"
import { ComponentProps } from "cinnabun/types"

export const SkeletonElement = (props: ComponentProps & { tag: string }) => {
  const { tag, className, ...rest } = props
  return new Component(tag, {
    ...rest,
    className: `skeleton ${className ?? ""}`,
  })
}
