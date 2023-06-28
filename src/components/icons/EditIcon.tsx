import * as Cinnabun from "cinnabun"
import { ComponentProps } from "cinnabun/types"
import { IconColorProps } from "."

export const EditIcon = (props: ComponentProps & IconColorProps) => {
  const { color = "#000000", ...rest } = props
  const hoverColor = props["color:hover"] ?? color

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1rem"
      viewBox="0 0 24 24"
      fill="none"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke={color}
      style={`--hover-stroke: ${hoverColor}`}
      className="stroke"
      {...rest}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
