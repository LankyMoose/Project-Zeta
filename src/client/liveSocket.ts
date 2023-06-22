import { Signal, createSignal } from "cinnabun"
import { PollData, PollVoteCounts } from "../types/polls"
import { getPolls } from "./actions/polls"

type TypedMessage = {
  type: string
  data?: any
}

type RealTimePollData = PollData & { loading?: boolean }

export class LiveSocket {
  socket: any
  public loading: Signal<boolean> = createSignal(true)
  public polls: Signal<RealTimePollData[]> = createSignal(
    [] as RealTimePollData[]
  )
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
    this.loading.value = false
  }

  private handleMessage(message: TypedMessage) {
    switch (message.type) {
      case "+poll":
        this.polls.value.push(message.data as PollData)
        this.polls.notify()
        break

      case "~voteCounts": {
        const poll = this.polls.value.find(
          (item) => item.poll.id === message.data.id
        )
        if (!poll) return console.error("Poll not found")
        poll.voteCounts = message.data.voteCounts as PollVoteCounts
        this.polls.notify()
        break
      }

      case "~pollUpdate": {
        let poll = this.polls.value.find(
          (item) => item.poll.id === message.data.id
        )
        if (!poll) return console.error("Poll not found")
        poll = message.data.pollData as PollData
        this.polls.notify()
        break
      }

      case "-poll":
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
