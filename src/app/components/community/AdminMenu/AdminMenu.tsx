import * as Cinnabun from "cinnabun"
import { ClickOutsideListener } from "cinnabun/listeners"
import { IconButton } from "../../../components/IconButton"
import { MoreIcon } from "../../../components/icons"
import { SlideInOut } from "cinnabun-transitions"
import "./AdminMenu.css"
import {
  communityDrawerOpen,
  communityDrawerState,
  pendingCommunityJoinRequests,
  selectedCommunity,
} from "../../../../state/community"
import { getCommunityJoinRequests } from "../../../../client/actions/communities"
import { PendingJoinRequests } from "../PendingJoinRequests"
import { EllipsisLoader } from "../../loaders/Ellipsis"
import { CommunityMemberManager } from "../CommunityMemberManager"

const loadRequests = async () => {
  const res = !!selectedCommunity.value?.id
    ? await getCommunityJoinRequests(selectedCommunity.value.id)
    : []
  pendingCommunityJoinRequests.value = res ?? []
}

export const AdminMenu = () => {
  const showMenu = Cinnabun.createSignal(false)
  const loadingRequests = Cinnabun.createSignal(false)
  const totalNotifications = () => pendingCommunityJoinRequests.value.length

  const handlePendingRequestsClick = () => {
    if (!showMenu.value) return
    showMenu.value = false
    communityDrawerState.value = {
      title: "Join Requests",
      componentFunc: PendingJoinRequests,
    }
    communityDrawerOpen.value = true
  }

  const handleManageMembersClick = () => {
    if (!showMenu.value) return
    showMenu.value = false
    communityDrawerState.value = {
      title: "Manage Members",
      componentFunc: CommunityMemberManager,
    }
    communityDrawerOpen.value = true
  }

  return (
    <div className="ml-auto" onMounted={loadRequests}>
      <ClickOutsideListener
        tag="div"
        onCapture={() => {
          if (showMenu.value) showMenu.value = false
        }}
      >
        <IconButton
          watch={[showMenu]}
          bind:className={() => `icon-button admin-menu-button ${showMenu.value ? "selected" : ""}`}
          onclick={() => {
            if (!showMenu.value) showMenu.value = true
          }}
        >
          <MoreIcon />
          <span
            watch={[pendingCommunityJoinRequests, loadingRequests]}
            bind:visible={() => totalNotifications() > 0}
            className="badge "
          >
            {totalNotifications()}
          </span>
        </IconButton>
        <div style="position:relative">
          <div className="admin-menu-wrapper">
            <SlideInOut
              className="admin-menu"
              watch={showMenu}
              settings={{ from: "top", duration: 225 }}
              properties={[{ name: "opacity", from: 0, to: 1, ms: 225 }]}
              bind:visible={() => showMenu.value}
              cancelExit={() => showMenu.value}
            >
              <ul>
                <li>
                  <a onclick={handleManageMembersClick} href="javascript:void(0)">
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
      </ClickOutsideListener>
    </div>
  )
}
