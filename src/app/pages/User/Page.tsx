import * as Cinnabun from "cinnabun"
import { Cinnabun as cb, Suspense, createSignal } from "cinnabun"
import { setPath } from "cinnabun/router"
import { pathStore, userStore } from "../../state/global"
import { MyCommunities } from "../../components/user/MyCommunities"
import { getUser } from "../../../client/actions/users"
import { PublicUser } from "../../../types/user"
import { DefaultLoader } from "../../components/loaders/Default"
import { title } from "../../Document"
import { EditIcon } from "../../components/icons"
import { IconButton } from "../../components/icons/IconButton"
import { Button } from "../../components/Button"
import { updateName } from "../../../client/actions/me"
import { userValidation } from "../../../db/validation"
import { EllipsisLoader } from "../../components/loaders/Ellipsis"

export default function UserPage({ params }: { params?: { userId?: string } }) {
  if (!params?.userId) return setPath(pathStore, "/users")
  const editing = createSignal(false)
  const name = createSignal("")
  const savingName = createSignal(false)

  if (!cb.isClient) return <></>

  const isSelfView = () => {
    return params.userId?.toLowerCase() === "me" || params.userId === userStore.value?.userId
  }

  const handleMount = () => {
    if (!userStore.value && isSelfView()) setPath(pathStore, `/`)
  }

  const loadUser = async () => {
    if (isSelfView()) {
      if (!userStore.value) return
      name.value = userStore.value.name
      title.value = `${userStore.value.name} | Project Zeta`
      return userStore.value
    }

    const res = await getUser(params.userId!)
    if (res) {
      title.value = `${res.name} | Project Zeta`
      name.value = res.name
    }

    return res
  }

  const saveName = async () => {
    if (!userStore.value) return
    savingName.value = true
    const res = await updateName(name.value)
    savingName.value = false
    if (!res) return
    editing.value = false
    userStore.value = res
  }

  const handleNameInput = (e: Event) => {
    const tgt = e.target as HTMLHeadingElement
    name.value = tgt.innerText
  }

  return (
    <div onMounted={handleMount}>
      <Suspense promise={loadUser}>
        {(loading: boolean, data?: PublicUser) => {
          if (loading) return <DefaultLoader />
          if (!data) return <></>

          return (
            <div className="page-title flex gap align-items-center">
              <div className="avatar-wrapper xl">
                <img src={data.picture} alt={data.name} className="avatar" />
                {isSelfView() ? (
                  <div className="avatar-overlay">
                    <IconButton className="icon-button bg-transparent">
                      <EditIcon color="var(--primary)" />
                    </IconButton>
                  </div>
                ) : (
                  <></>
                )}
              </div>
              <h1
                watch={editing}
                bind:innerText={() => name.value}
                bind:contenteditable={() => editing.value}
                oninput={handleNameInput}
              />
              {isSelfView() ? (
                <>
                  <IconButton
                    onclick={() => (editing.value = true)}
                    watch={editing}
                    bind:visible={() => !editing.value}
                    bind:className={() => `icon-button${editing.value ? " selected" : ""}`}
                  >
                    <EditIcon color="var(--primary)" />
                  </IconButton>
                  <Button
                    className="btn btn-secondary hover-animate"
                    watch={editing}
                    bind:visible={() => editing.value}
                    onclick={() => {
                      name.value = userStore.value?.name || ""
                      editing.value = false
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="btn btn-primary hover-animate"
                    watch={[editing, name, savingName]}
                    bind:visible={() => editing.value}
                    bind:disabled={() =>
                      savingName.value ||
                      name.value === userStore.value?.name ||
                      !userValidation.isUserNameValid(name.value)
                    }
                    onclick={saveName}
                  >
                    Save
                    <EllipsisLoader watch={savingName} bind:visible={() => savingName.value} />
                  </Button>
                </>
              ) : (
                <></>
              )}
            </div>
          )
        }}
      </Suspense>
      <div watch={userStore} bind:visible={() => !cb.isClient || isSelfView()}>
        <MyCommunities />
      </div>
    </div>
  )
}
