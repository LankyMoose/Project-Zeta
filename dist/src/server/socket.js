const pollSubscriptions = {};
const userConns = new Map();
export const subscribeToPolls = (req, pollIds) => {
    const anonId = req.cookies["user_anon_id"];
    if (!anonId)
        return;
    pollIds.forEach((pollId) => {
        if (!pollSubscriptions[pollId]) {
            pollSubscriptions[pollId] = [];
        }
        if (pollSubscriptions[pollId].includes(anonId))
            return;
        pollSubscriptions[pollId].push(anonId);
    });
};
const addUserRef = (anonId, socket) => {
    const current = userConns.get(anonId) ?? [];
    if (current.includes(socket))
        return;
    current.push(socket);
    userConns.set(anonId, current);
};
const removeUserRef = (anonId) => {
    const current = userConns.get(anonId) ?? [];
    current.forEach((conn) => {
        conn.socket.close();
    });
    userConns.delete(anonId);
};
export const broadcastPollUpdate = (pollId, pollUpdateMessage) => {
    const anonIds = pollSubscriptions[pollId];
    if (!anonIds || anonIds.length === 0)
        return;
    console.log("broadcasting poll update to", anonIds, pollUpdateMessage);
    anonIds.forEach((id) => {
        const conns = userConns.get(id);
        if (!conns)
            return;
        conns.forEach((conn) => {
            if (conn.socket.readyState !== 1)
                return;
            if (conn.socket.readyState === 1) {
                conn.socket.send(JSON.stringify(pollUpdateMessage));
            }
            if (conn.socket.readyState === 2) {
                console.log("closing socket");
                conn.socket.close();
            }
        });
    });
};
export const socketHandler = (conn, req) => {
    const anonId = req.cookies["user_anon_id"];
    if (!anonId)
        return console.error("new ws req - no anon id");
    addUserRef(anonId, conn);
    conn.setEncoding("utf8");
    conn.on("data", (chunk) => {
        const data = JSON.parse(chunk);
        switch (data.type) {
            case "ping":
                conn.socket.send(JSON.stringify({ type: "ping" }));
                return;
            default:
        }
    });
    conn.on("close", () => removeUserRef(anonId));
    conn.on("end", () => removeUserRef(anonId));
    conn.on("error", () => removeUserRef(anonId));
};
