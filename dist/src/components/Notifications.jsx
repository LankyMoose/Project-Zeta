import * as Cinnabun from "cinnabun";
import { Component } from "cinnabun";
import "./Notifications.css";
import { generateUUID } from "../utils";
import { DomInterop } from "cinnabun/src/domInterop";
import { useTransition } from "cinnabun-transitions";
export const NotificationType = {
    info: "info",
    success: "success",
    error: "error",
    warning: "warning",
};
export const notificationStore = {};
export const addNotification = ({ text, type = "info", duration = 3000, }) => {
    const id = generateUUID();
    const notification = {
        id,
        text,
        type,
        duration,
    };
    notification.component = new NotificationComponent(id, type, text);
    const iNotif = notification;
    notificationStore[iNotif.id] = iNotif;
};
class NotificationComponent extends Component {
    constructor(id, type, text) {
        const { onMounted, onBeforeUnmounted, initialStyle } = useTransition({
            properties: [
                {
                    name: "opacity",
                    from: "0",
                    to: "1",
                },
                {
                    name: "translate",
                    from: "100%",
                    to: "0%",
                },
            ],
        });
        super("div", {
            ["data-id"]: id,
            className: `notification ${type}`,
            children: [text],
            style: initialStyle,
            onMounted,
            onBeforeUnmounted,
        });
    }
}
export class NotificationTrayComponent extends Component {
    constructor(animationDuration) {
        super("div", { className: "notification-tray" });
        Object.defineProperty(this, "animationDuration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: animationDuration
        });
        const addNotification = (notification) => {
            const child = notification.component;
            this.prependChildren(child);
            const element = child.element;
            element?.addEventListener("mouseenter", function handler() {
                child.props.hovered = true;
            });
            element?.addEventListener("mouseleave", function handler() {
                child.props.hovered = false;
            });
        };
        const removeNotification = (notification) => {
            const child = notification.component;
            child.element?.removeEventListener("mouseenter", function handler() {
                child.props.hovered = true;
            });
            child.element?.removeEventListener("mouseleave", function handler() {
                child.props.hovered = false;
            });
            DomInterop.unRender(child);
            delete notificationStore[notification.id];
        };
        if (Cinnabun.Cinnabun.isClient) {
            const tickRateMs = 33;
            setInterval(() => {
                const children = this.children;
                for (const [k, notification] of Object.entries(notificationStore)) {
                    const c = children.find((child) => child.props["data-id"] === k);
                    if (!c) {
                        addNotification(notification);
                    }
                }
                const deleteList = [];
                children.forEach((c) => {
                    if (c.props.hovered)
                        return;
                    const notifId = c.props["data-id"];
                    const notification = notificationStore[notifId];
                    if (!notification)
                        throw new Error("failed to get notification");
                    notification.duration -= tickRateMs;
                    if (notification.duration <= 0) {
                        removeNotification(notification);
                        deleteList.push(notifId);
                    }
                    else if (notification.duration < this.animationDuration) {
                        if (!c.props.hidden) {
                            c.props.hidden = true;
                        }
                    }
                });
                if (deleteList.length) {
                    const children = this.children;
                    this.children = children.filter((c) => !deleteList.includes(c.props["data-id"]));
                    for (const id of deleteList) {
                        delete notificationStore[id];
                    }
                }
            }, tickRateMs);
        }
    }
}
export const NotificationTray = ({ animationDuration = 500, }) => new NotificationTrayComponent(animationDuration);
