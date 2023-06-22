import { FastifyRequest } from "fastify"
import { SocketStream } from "@fastify/websocket"

type PollID = string

const pollSubscriptions: Record<PollID, UserConn[]> = {}
type UserConn = {
  stream: SocketStream
  anonId: string
}
const userConnections: UserConn[] = []
const findUserConnByReq = (req: FastifyRequest) => {
  return userConnections.find(
    (conn) => conn.anonId === req.cookies["user_anon_id"]
  )
}
export const subscribeToPolls = (req: FastifyRequest, pollIds: string[]) => {
  const userConn = findUserConnByReq(req)
  if (!userConn) return
  pollIds.forEach((pollId) => {
    if (!pollSubscriptions[pollId]) {
      pollSubscriptions[pollId] = []
    }
    pollSubscriptions[pollId].push(userConn)
  })
}

export const broadcastPollUpdate = (pollId: string, pollUpdateMessage: any) => {
  const pollSubs = pollSubscriptions[pollId]
  if (!pollSubs) return
  pollSubs.forEach((conn) => {
    conn.stream.socket.send(JSON.stringify(pollUpdateMessage))
  })
}

export const socketHandler = (conn: SocketStream, req: FastifyRequest) => {
  const ref = {
    stream: conn,
    anonId: req.cookies["user_anon_id"] ?? "",
  }

  if (ref.anonId) userConnections.push(ref)

  conn.setEncoding("utf8")
  conn.on("data", (chunk) => {
    const data = JSON.parse(chunk)

    switch (data.type) {
      case "ping":
        conn.socket.send(JSON.stringify({ type: "ping" }))
        return
      default:
    }
  })
  conn.on("close", () => {
    userConnections.splice(userConnections.indexOf(ref), 1)
    if (!ref.anonId) return
    Object.values(pollSubscriptions).forEach((pollSubs) => {
      pollSubs.splice(pollSubs.indexOf(ref), 1)
    })
  })
}
