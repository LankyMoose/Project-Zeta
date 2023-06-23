import { FastifyRequest } from "fastify"
import { SocketStream } from "@fastify/websocket"

type PollID = string
type ReqID = string

const pollSubscriptions: Record<PollID, ReqID[]> = {}
type UserConn = {
  stream: SocketStream
  reqId: ReqID
}
let userConnections: UserConn[] = []
const findUserConnByReq = (req: FastifyRequest) => {
  return userConnections.find((uc) => uc.reqId === req.id)
}
export const subscribeToPolls = (req: FastifyRequest, pollIds: string[]) => {
  const userConn = findUserConnByReq(req)
  if (!userConn) return
  pollIds.forEach((pollId) => {
    if (!pollSubscriptions[pollId]) {
      pollSubscriptions[pollId] = []
    }
    pollSubscriptions[pollId].push(userConn.reqId)
  })
}

const removeUserRef = (reqId: string) => {
  userConnections = userConnections.filter((uc) => uc.reqId !== reqId)
  Object.values(pollSubscriptions).forEach((ids) => {
    ids = ids.filter((id) => id !== reqId)
  })
}

export const broadcastPollUpdate = (pollId: string, pollUpdateMessage: any) => {
  console.log(
    "broadcasting poll update",
    userConnections.map((uc) => uc.reqId)
  )
  const reqIds = pollSubscriptions[pollId]
  if (!reqIds) return
  console.log("broadcasting to", reqIds)
  reqIds.forEach((id) => {
    const conn = userConnections.find((uc) => uc.reqId === id)?.stream
    if (!conn || conn.closed) return removeUserRef(id)
    conn.socket.send(JSON.stringify(pollUpdateMessage))
  })
}

export const socketHandler = (conn: SocketStream, req: FastifyRequest) => {
  const ref = { stream: conn, reqId: req.id }
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
  conn.on("close", () => removeUserRef(req.id))
}
