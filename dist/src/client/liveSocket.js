import { createSignal } from "cinnabun";
export class LiveSocket {
    constructor(url) {
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "loading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createSignal(true)
        });
        this.socket = new WebSocket(url);
        this.socket.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                if (!("type" in data))
                    throw new Error("received invalid message");
                this.handleMessage(data);
            }
            catch (error) {
                console.error(error);
            }
        };
        this.socket.onopen = () => {
            setInterval(() => {
                if (this.socket.readyState !== this.socket.OPEN)
                    return;
                this.socket.send(JSON.stringify({ type: "ping" }));
            }, 3000);
        };
        this.load();
    }
    async load() {
        this.loading.value = false;
    }
    handleMessage(message) {
        switch (message.type) {
            case "ping":
                return;
            default:
                return;
        }
    }
}
export const createLiveSocket = () => {
    const { hostname, port } = window.location;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return new LiveSocket(`${protocol}://${hostname}:${port}/ws`);
};
