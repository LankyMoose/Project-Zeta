import * as Cinnabun from "cinnabun"
import { ComponentProps } from "cinnabun/types"
import { IconColorProps } from "."

export const SearchIcon = (props: ComponentProps & IconColorProps) => {
  const { color = "#000000", ...rest } = props
  const hoverColor = props["color:hover"] ?? color

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="stroke"
      style={`--hover-stroke: ${hoverColor}`}
      {...rest}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
