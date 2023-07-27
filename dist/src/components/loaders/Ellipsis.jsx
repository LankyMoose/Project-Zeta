import * as Cinnabun from "cinnabun";
import "./Ellipsis.css";
export const EllipsisLoader = (props) => {
    const { className, ...rest } = props;
    return (<div className={`lds-ellipsis ${className}`} {...rest}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>);
};
