import { Signal, createSignal } from "cinnabun"

type TypedMessage = {
  type: string
  data?: any
}

export class LiveSocket {
  socket: any
  public loading: Signal<boolean> = createSignal(true)

  constructor(url: string) {
    this.socket = new WebSocket(url)
    this.socket.onmessage = (msg: any) => {
      try {
        const data = JSON.parse(msg.data)
        if (!("type" in data)) throw new Error("received invalid message")
        this.handleMessage(data as TypedMessage)
      } catch (error) {
        console.error(error)
      }
    }
    this.socket.onopen = () => {
      setInterval(() => {
        if (this.socket.readyState !== this.socket.OPEN) return
        this.socket.send(JSON.stringify({ type: "ping" }))
      }, 3000)
    }

    this.load()
  }

  private async load() {
    this.loading.value = false
  }

  private handleMessage(message: TypedMessage) {
    switch (message.type) {
      case "ping":
        return
      default:
        return
    }
  }
}

export const createLiveSocket = () => {
  const { hostname, port } = window.location
  const protocol = window.location.protocol === "https:" ? "wss" : "ws"
  return new LiveSocket(`${protocol}://${hostname}:${port}/ws`)
}
