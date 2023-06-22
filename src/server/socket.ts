import { FastifyRequest, RawRequestDefaultExpression } from "fastify"
import { SocketStream } from "@fastify/websocket"

type Socket = RawRequestDefaultExpression["socket"]

const userPollSubscriptions: Record<string, UserConn[]> = {}
type UserConn = {
  stream: SocketStream
  socket: Socket
}
const userConnections: UserConn[] = []
const findUserConnBySocket = (socket: Socket) => {
  return userConnections.find((conn) => conn.socket === socket)
}
export const subscribeToPolls = (conn: Socket, pollIds: string[]) => {
  const userConn = findUserConnBySocket(conn)
  if (!userConn) return
  pollIds.forEach((pollId) => {
    if (!userPollSubscriptions[pollId]) {
      userPollSubscriptions[pollId] = []
    }
    userPollSubscriptions[pollId].push(userConn)
  })
}

export const broadcastPollUpdate = (pollId: string, pollUpdateMessage: any) => {
  const pollSubs = userPollSubscriptions[pollId]
  if (!pollSubs) return
  pollSubs.forEach((conn) => {
    conn.stream.socket.send(JSON.stringify(pollUpdateMessage))
  })
}

export const socketHandler = (conn: SocketStream, _req: FastifyRequest) => {
  const ref = {
    stream: conn,
    socket: _req.socket,
  }
  userConnections.push(ref)

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
    Object.values(userPollSubscriptions).forEach((pollSubs) => {
      pollSubs.splice(pollSubs.indexOf(ref), 1)
    })
  })
}
