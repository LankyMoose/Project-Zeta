import * as Cinnabun from "cinnabun";
export const Button = (props, children) => {
    return (<button {...props}>
      <span className="flex align-items-center gap-sm">{children}</span>
    </button>);
};
