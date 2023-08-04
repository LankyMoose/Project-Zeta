import * as Cinnabun from "cinnabun"
import { Component } from "cinnabun"
import "./Notifications.css"
import { generateUUID } from "../../../utils"
import { DomInterop } from "cinnabun/src/domInterop"
import { useTransition } from "cinnabun-transitions"

export const NotificationType = {
  info: "info",
  success: "success",
  error: "error",
  warning: "warning",
}

interface INotification {
  id: string
  text: string
  type: keyof typeof NotificationType
  duration: number
  component: NotificationComponent
}

export const notificationStore: Record<string, INotification> = {}

export const addNotification = ({
  text,
  type = "info",
  duration = 3000,
}: {
  text: string
  type?: keyof typeof NotificationType
  duration?: number
}) => {
  const id = generateUUID()
  const notification: Partial<INotification> = {
    id,
    text,
    type,
    duration,
  }
  notification.component = new NotificationComponent(id, type, text)
  const iNotif = notification as INotification
  notificationStore[iNotif.id] = iNotif
}

class NotificationComponent extends Component {
  constructor(id: string, type: keyof typeof NotificationType, text: string) {
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
    })
    super("div", {
      ["data-id"]: id,
      className: `notification ${type}`,
      children: [text],
      style: initialStyle,
      onMounted,
      onBeforeUnmounted,
    })
  }
}

export class NotificationTrayComponent extends Component {
  constructor(private animationDuration: number) {
    super("div", { className: "notification-tray" })

    const addNotification = (notification: INotification) => {
      const child = notification.component
      this.prependChildren(child)
      const element = child.element
      element?.addEventListener("mouseenter", function handler() {
        child.props.hovered = true
      })

      element?.addEventListener("mouseleave", function handler() {
        child.props.hovered = false
      })
    }

    const removeNotification = (notification: INotification) => {
      const child = notification.component
      child.element?.removeEventListener("mouseenter", function handler() {
        child.props.hovered = true
      })

      child.element?.removeEventListener("mouseleave", function handler() {
        child.props.hovered = false
      })
      DomInterop.unRender(child)
      delete notificationStore[notification.id]
    }

    if (Cinnabun.Cinnabun.isClient) {
      const tickRateMs = 33

      setInterval(() => {
        const children = this.children as NotificationComponent[]

        for (const [k, notification] of Object.entries(notificationStore)) {
          const c = children.find((child) => child.props["data-id"] === k)
          if (!c) {
            addNotification(notification)
          }
        }
        const deleteList: string[] = []
        children.forEach((c) => {
          if (c.props.hovered) return

          const notifId: string = c.props["data-id"]
          const notification: INotification | undefined = notificationStore[notifId]

          if (!notification) throw new Error("failed to get notification")

          notification.duration -= tickRateMs

          if (notification.duration <= 0) {
            removeNotification(notification)
            deleteList.push(notifId)
          } else if (notification.duration < this.animationDuration) {
            if (!c.props.hidden) {
              c.props.hidden = true
            }
          }
        })
        if (deleteList.length) {
          const children = this.children as NotificationComponent[]
          this.children = children.filter((c) => !deleteList.includes(c.props["data-id"]))
          for (const id of deleteList) {
            delete notificationStore[id]
          }
        }
      }, tickRateMs)
    }
  }
}

export const NotificationTray = ({ animationDuration = 500 }: { animationDuration?: number }) =>
  new NotificationTrayComponent(animationDuration)
