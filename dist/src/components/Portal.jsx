import { createPortal } from "cinnabun";
export const Portal = ({ children }) => {
    const rootId = "portal-root";
    return createPortal(children ?? [], rootId);
};
