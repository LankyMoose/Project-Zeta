import * as Cinnabun from "cinnabun"
import { type Component } from "cinnabun"
import { bodyStyle } from "./state/global"

export const Document = (App: { (): Component }) => {
  return (
    <>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SSR App</title>
        <link rel="stylesheet" href="/static/index.css" />
      </head>

      <body watch={bodyStyle} bind:style={() => bodyStyle.value}>
        <div id="app">
          <App />
        </div>
        <div id="portal-root"></div>
      </body>
    </>
  )
}
