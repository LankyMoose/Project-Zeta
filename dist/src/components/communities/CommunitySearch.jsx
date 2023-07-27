import * as Cinnabun from "cinnabun";
import { createSignal } from "cinnabun";
import { getCommunitySearch } from "../../client/actions/communities";
import "./CommunitySearch.css";
import { Link } from "cinnabun/router";
import { pathStore } from "../../state";
import { EllipsisLoader } from "../loaders/Ellipsis";
import { KeyboardListener } from "cinnabun/listeners";
const inputState = createSignal("");
const loading = createSignal(false);
const results = createSignal(null);
export const CommunitySearch = () => {
    let inputEl = null;
    const handleChange = (e) => {
        const target = e.target;
        inputState.value = target.value;
    };
    const onMounted = (self) => {
        inputEl = self.element;
    };
    const focusSearchInput = (e) => {
        const kbEvnt = e;
        if (kbEvnt.metaKey || kbEvnt.ctrlKey) {
            e.preventDefault();
            inputEl?.focus();
        }
    };
    return (<div className="community-search">
      <KeyboardListener keys={["k"]} onCapture={(_, e) => focusSearchInput(e)}/>
      <KeyboardListener keys={["Escape"]} onCapture={() => inputEl?.blur()}/>
      <div className="input-wrapper">
        <input type="text" watch={inputState} bind:value={() => inputState.value} oninput={handleChange} placeholder="Search for a community" onMounted={onMounted}/>
        <EllipsisLoader className="loader" watch={loading} bind:visible={() => loading.value}/>
      </div>
      <ResultsList />
    </div>);
};
const ResultsList = () => {
    let unsub = undefined;
    let timeout = undefined;
    const onMounted = () => {
        unsub = inputState.subscribe(async (val) => {
            if (val.length === 0) {
                results.value = null;
                return;
            }
            if (val.length < 3)
                return;
            if (val === results.value?.search)
                return;
            // queue up a search action using setTimeout - if we type again before it resolves, it will cancel the previous one
            if (timeout)
                window.clearTimeout(timeout);
            loading.value = true;
            timeout = window.setTimeout(async () => {
                const data = await getCommunitySearch(val);
                if (!data)
                    return;
                results.value = data;
                loading.value = false;
            }, 250);
        });
    };
    const onUnmounted = () => {
        if (unsub)
            unsub();
    };
    return (<ul onMounted={onMounted} onUnmounted={onUnmounted} watch={results} bind:children>
      {() => results.value ? (results.value.communities.map((community) => <ResultItem community={community}/>)) : (<></>)}
    </ul>);
};
const ResultItem = ({ community }) => {
    const handleNavigate = () => {
        loading.value = false;
        results.value = null;
        inputState.value = "";
    };
    return (<li onclick={handleNavigate}>
      <Link store={pathStore} to={`/communities/${community.url_title}`} className="community-link">
        {community.title}
      </Link>
    </li>);
};
