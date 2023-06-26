import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { getCommunitySearch } from "../../client/actions/communities"
import "./CommunitySearch.css"
import { CommunitySearchData, CommunityLinkData } from "../../types/community"
import { Link } from "cinnabun/router"
import { pathStore } from "../../state"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { KeyboardListener } from "cinnabun/listeners"

const inputState = createSignal("")
const loading = createSignal(false)
const results = createSignal<CommunitySearchData | null>(null)

export const CommunitySearch = () => {
  let inputEl: HTMLInputElement | null = null
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    inputState.value = target.value
  }

  const onMounted = (self: Cinnabun.Component) => {
    inputEl = self.element as HTMLInputElement
  }

  const handleShortcut = (e: Event) => {
    e.preventDefault()
    const kbEvnt = e as KeyboardEvent
    if (kbEvnt.ctrlKey) {
      e.preventDefault()
      if (inputEl) inputEl.focus()
    }
  }

  return (
    <div className="community-search">
      <KeyboardListener keys={["k"]} onCapture={(_, e) => handleShortcut(e)} />
      <KeyboardListener keys={["Escape"]} onCapture={() => inputEl?.blur()} />
      <div className="input-wrapper">
        <input
          type="text"
          watch={inputState}
          bind:value={() => inputState.value}
          oninput={handleChange}
          placeholder="Search for a community"
          onMounted={onMounted}
        />
        <EllipsisLoader className="loader" watch={loading} bind:visible={() => loading.value} />
      </div>
      <ResultsList />
    </div>
  )
}

const ResultsList = () => {
  let unsub: { (): void } | undefined = undefined

  const onMounted = () => {
    unsub = inputState.subscribe(async (val) => {
      if (val.length === 0) {
        results.value = null
        return
      }
      loading.value = true
      const res = await getCommunitySearch(val)
      loading.value = false
      if (!res) return
      if (res.search !== val) return

      results.value = res
    })
  }
  const onUnmounted = () => {
    if (unsub) unsub()
  }
  return (
    <ul onMounted={onMounted} onUnmounted={onUnmounted} watch={results} bind:children>
      {() => results.value?.communities.map((community) => <ResultItem community={community} />)}
    </ul>
  )
}

const ResultItem = ({ community }: { community: CommunityLinkData }) => {
  const handleNavigate = () => {
    loading.value = false
    results.value = null
    inputState.value = ""
  }
  return (
    <li onclick={handleNavigate}>
      <Link store={pathStore} to={`/communities/${community.url_title}`} className="community-link">
        {community.title}
      </Link>
    </li>
  )
}
