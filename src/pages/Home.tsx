import * as Cinnabun from "cinnabun"
import { Cinnabun as cb } from "cinnabun"
import { getLatestPostsFromMyCommunities } from "../client/actions/me"

if (cb.isClient) {
  ;(async () => {
    const res = await getLatestPostsFromMyCommunities()
    console.log(res)
  })()
}

export default function Home() {
  return (
    <>
      <h1>Home</h1>
    </>
  )
}
