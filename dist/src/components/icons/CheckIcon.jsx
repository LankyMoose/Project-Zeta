import * as Cinnabun from "cinnabun";
export const CheckIcon = (props) => {
    const { color = "#000000", ...rest } = props;
    const hoverColor = props["color:hover"] ?? color;
    return (<svg width="1rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <g id="Interface / Check">
        <path id="Vector" d="M6 12L10.2426 16.2426L18.727 7.75732" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={`--hover-stroke: ${hoverColor}`} className="stroke"/>
      </g>
    </svg>);
};
