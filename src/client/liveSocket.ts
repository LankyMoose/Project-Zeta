import { Signal, createSignal } from "cinnabun"
import { PollData } from "../types/polls"
import { getPolls } from "./actions/polls"

type TypedMessage = {
  type: string
  data?: any
}

export class LiveSocket {
  socket: any
  public polls: Signal<PollData[]> = createSignal([] as PollData[])
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
      }, 1000)
    }

    this.load()
  }

  private async load() {
    this.polls.value = await getPolls()
  }

  private handleMessage(message: TypedMessage) {
    switch (message.type) {
      case "+poll":
        this.polls.value.push(message.data as PollData)
        this.polls.notify()
        break
      case "-chat":
        const idx = this.polls.value.findIndex(
          (item) => item.poll.id === message.data.id
        )
        if (idx === -1) return
        this.polls.value.splice(idx, 1)
        this.polls.notify()
        break
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
