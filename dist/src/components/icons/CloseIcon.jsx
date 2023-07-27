import * as Cinnabun from "cinnabun";
export const CloseIcon = (props) => {
    const { color = "#000000", ...rest } = props;
    const hoverColor = props["color:hover"] ?? color;
    return (<svg xmlns="http://www.w3.org/2000/svg" width="1rem" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke={color} style={`--hover-stroke: ${hoverColor}`} className="stroke" {...rest}>
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>);
};
