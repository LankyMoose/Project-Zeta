import * as Cinnabun from "cinnabun"
import { Drawer, DrawerBody, DrawerHeader } from "../drawer/Drawer"
import { communityDrawerOpen, communityDrawerState } from "../../state"

export const CommunityDrawer = () => {
  return (
    <Drawer
      visible={communityDrawerOpen}
      side="right"
      toggle={() => (communityDrawerOpen.value = false)}
    >
      <DrawerHeader>
        <h2 className="m-0">{() => communityDrawerState.value.title}</h2>
      </DrawerHeader>
      <DrawerBody>
        {() =>
          communityDrawerState.value.componentFunc ? (
            communityDrawerState.value.componentFunc()
          ) : (
            <></>
          )
        }
      </DrawerBody>
    </Drawer>
  )
}
