import * as Cinnabun from "cinnabun";
import { KeyboardListener, NavigationListener } from "cinnabun/listeners";
import { FadeInOut, Transition } from "cinnabun-transitions";
import "./Modal.css";
const defaultGestures = {
    closeOnNavigate: true,
    closeOnClickOutside: true,
    closeOnEscape: true,
};
export const Modal = ({ visible, toggle, onclose, gestures = {} }, children) => {
    const _gestures = { ...defaultGestures, ...gestures };
    const { closeOnNavigate, closeOnClickOutside, closeOnEscape } = _gestures;
    return (<FadeInOut properties={[{ name: "opacity", from: 0, to: 1, ms: 350 }]} className="modal-outer" tabIndex={-1} watch={visible} bind:visible={() => {
            if (!visible.value && onclose)
                onclose();
            return visible.value;
        }} onmouseup={(e) => {
            if (!visible.value || !closeOnClickOutside)
                return;
            const el = e.target;
            if (el.className === "modal-outer")
                toggle();
        }}>
      <Transition className="modal" properties={[{ name: "translate", from: "0 -5rem", to: "0 0", ms: 350 }]} watch={visible} bind:visible={() => visible.value}>
        <NavigationListener onCapture={() => closeOnNavigate && toggle()}/>
        <KeyboardListener keys={["Escape"]} onCapture={() => closeOnEscape && toggle()}/>
        {children}
      </Transition>
    </FadeInOut>);
};
export const ModalHeader = (props, children) => {
    return (<div className="modal-header" {...props}>
      {children}
    </div>);
};
export const ModalBody = (props, children) => {
    return (<div className="modal-body" {...props}>
      {children}
    </div>);
};
export const ModalFooter = (props, children) => {
    return (<div className="modal-footer" {...props}>
      {children}
    </div>);
};
