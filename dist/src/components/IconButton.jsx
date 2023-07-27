import * as Cinnabun from "cinnabun";
import "./IconButton.css";
export const IconButton = ({ children, ...rest }) => {
    const { className, ...others } = rest;
    const _className = "icon-button " + (rest.className ?? "");
    return (<button className={_className} {...others}>
      {children}
    </button>);
};
