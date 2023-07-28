import * as Cinnabun from "cinnabun"
import { IconButton } from "../../IconButton"
import { MoreIcon } from "../../icons"
import { SlideInOut } from "cinnabun-transitions"
import "./AdminMenu.css"
import {
  communityDrawerOpen,
  communityDrawerState,
  pendingCommunityJoinRequests,
  selectedCommunity,
} from "../../../state/community"
import { getCommunityJoinRequests } from "../../../client/actions/communities"
import { PendingJoinRequests } from "../PendingJoinRequests"
import { EllipsisLoader } from "../../loaders/Ellipsis"

const loadRequests = async () => {
  const res = !!selectedCommunity.value?.id
    ? await getCommunityJoinRequests(selectedCommunity.value.id)
    : []
  pendingCommunityJoinRequests.value = res ?? []
}

const handlePendingRequestsClick = () => {
  communityDrawerState.value = {
    title: "Join Requests",
    componentFunc: PendingJoinRequests,
  }
  communityDrawerOpen.value = true
}

export const AdminMenu = () => {
  const showMenu = Cinnabun.createSignal(false)
  const loadingRequests = Cinnabun.createSignal(false)
  const totalNotifications = () => pendingCommunityJoinRequests.value.length

  return (
    <div className="ml-auto" onMounted={loadRequests}>
      <IconButton
        watch={[showMenu, pendingCommunityJoinRequests, loadingRequests]}
        bind:className={() => `icon-button admin-menu-button ${showMenu.value ? "selected" : ""}`}
        onclick={() => (showMenu.value = !showMenu.value)}
        bind:children
      >
        <MoreIcon />
        {() =>
          loadingRequests.value ? (
            <EllipsisLoader style="color:var(--text-color); font-size: .75rem;" />
          ) : totalNotifications() > 0 ? (
            <span className="badge ">{totalNotifications()}</span>
          ) : (
            <></>
          )
        }
      </IconButton>
      <div style="position:relative">
        <div className="admin-menu-wrapper">
          <SlideInOut
            className="admin-menu"
            watch={showMenu}
            settings={{ from: "top" }}
            properties={[{ name: "opacity", from: 0, to: 1 }]}
            bind:visible={() => showMenu.value}
          >
            <ul>
              <li>
                <a href="javascript:void(0)">
                  <small>Manage members</small>
                </a>
              </li>
              {selectedCommunity.value?.private ? (
                <li>
                  <a
                    href="javascript:void(0)"
                    onclick={handlePendingRequestsClick}
                    watch={[pendingCommunityJoinRequests, loadingRequests]}
                    bind:children
                  >
                    <small>Join Requests</small>
                    {() =>
                      loadingRequests.value ? (
                        <EllipsisLoader style="color:var(--text-color); font-size: .75rem;" />
                      ) : (
                        <span className="badge ">
                          {() => pendingCommunityJoinRequests.value.length}
                        </span>
                      )
                    }
                  </a>
                </li>
              ) : (
                <></>
              )}
            </ul>
          </SlideInOut>
        </div>
      </div>
    </div>
  )
}
