import "./styles/page.css"
import "./styles/index.css"
import "./styles/button.css"
import "./styles/avatar.css"
import "./styles/card.css"
import "./styles/utilities.css"
import "./styles/form.css"
import "./styles/badge.css"

import { Hydration } from "cinnabun/hydration"
import { Document } from "../app/Document"
import { SSRProps } from "cinnabun/src/types"
import { App } from "../app/App"
import { Cinnabun } from "cinnabun"
import { createLiveSocket } from "./liveSocket"
import { selectedPost } from "../state/post"
import { isUuid } from "../utils"

const env = process.env.NODE_ENV ?? "development"

if ("__cbData" in window) {
  try {
    Cinnabun.registerRuntimeServices(createLiveSocket())
    Hydration.hydrate(Document(App), window.__cbData as SSRProps)
    const params = new URLSearchParams(window.location.search)
    const postId = params.get("post")
    if (postId && isUuid(postId)) {
      selectedPost.value = { id: postId }
    }
  } catch (error) {
    console.error(error)
  }

  if (env === "development") {
    const evtHandler = new EventSource("/sse")
    let didConnect = false
    evtHandler.addEventListener("handshake", () => {
      didConnect = true
    })

    evtHandler.addEventListener("error", (evt: Event) => {
      const connIsReset = didConnect && evtHandler.readyState === 0
      if (connIsReset) location.reload()
      console.log("evtHandler err evt", evt)
    })
  }
}
