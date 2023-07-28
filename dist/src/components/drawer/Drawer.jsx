import * as Cinnabun from "cinnabun";
import { KeyboardListener, NavigationListener } from "cinnabun/listeners";
import { FadeInOut, SlideInOut } from "cinnabun-transitions";
import "./Drawer.css";
const defaultGestures = {
    closeOnNavigate: true,
    closeOnClickOutside: true,
    closeOnEscape: true,
};
export const Drawer = ({ visible, side, toggle, onclose, gestures = {} }, children) => {
    const _gestures = { ...defaultGestures, ...gestures };
    const { closeOnNavigate, closeOnClickOutside, closeOnEscape } = _gestures;
    return (<FadeInOut properties={[{ name: "opacity", from: 0, to: 1, ms: 350 }]} className="drawer-outer" tabIndex={-1} watch={visible} bind:visible={() => {
            if (!visible.value && onclose)
                onclose();
            return visible.value;
        }} onmouseup={(e) => {
            if (!visible.value || !closeOnClickOutside)
                return;
            const el = e.target;
            if (el.className === "drawer-outer")
                toggle();
        }}>
      <SlideInOut className={`drawer drawer-${side} flex flex-column`} watch={visible} bind:visible={() => visible.value} settings={{ from: side }}>
        <NavigationListener onCapture={() => closeOnNavigate && toggle()}/>
        <KeyboardListener keys={["Escape"]} onCapture={() => closeOnEscape && toggle()}/>
        {children}
      </SlideInOut>
    </FadeInOut>);
};
export const DrawerHeader = (props, children) => {
    return (<div className="drawer-header" {...props}>
      {children}
    </div>);
};
export const DrawerBody = (props, children) => {
    return (<div className="drawer-body flex-grow" {...props}>
      {children}
    </div>);
};
export const DrawerFooter = (props, children) => {
    return (<div className="drawer-footer" {...props}>
      {children}
    </div>);
};
