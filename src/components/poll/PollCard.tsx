import * as Cinnabun from "cinnabun"
import { Cinnabun as cb } from "cinnabun"
import { PollData } from "../../types/polls"
import { PollOptionButton } from "./PollOptionButton"
import { getTotalVotes } from "./utils"
import { LiveSocket } from "../../client/liveSocket"
import { userStore } from "../../state"
import { deletePoll } from "../../client/actions/polls"
import { addNotification } from "../Notifications"
import { IconButton } from "../IconButton"
import * as Icons from "../icons"

export const PollCard = (props: PollData) => {
  const deleting = Cinnabun.createSignal(false)

  const state = Cinnabun.createSignal(props)
  const titleText = props.poll.desc
  const titleClass =
    "card-title " +
    (titleText.length > 128
      ? "x-small"
      : titleText.length > 64
      ? "small"
      : "large")

  let unsub: { (): void } | undefined = undefined
  const onMounted = () => {
    unsub = cb.getRuntimeService(LiveSocket).polls.subscribe((newVal) => {
      for (const pollData of newVal) {
        if (pollData.poll.id === props.poll.id) {
          state.value = pollData
          break
        }
      }
    })
  }
  const onUnmounted = () => {
    if (!unsub) return
    unsub()
  }

  const handleDelete = async () => {
    try {
      if (deleting.value) return
      if (
        !confirm(
          "Are you really sure you want to delete this poll? This can't be undone!"
        )
      )
        return
      const polls = cb.getRuntimeService(LiveSocket).polls
      const poll = polls.value.find((poll) => poll.poll.id === props.poll.id)!
      if (poll.loading) return

      deleting.value = true
      await deletePoll(props.poll.id)

      polls.value = polls.value.filter((poll) => poll.poll.id !== props.poll.id)
      polls.notify()
      addNotification({
        text: "Deleted",
        type: "success",
      })
    } catch (error) {
      addNotification({
        text: "Error",
        type: "error",
      })
      deleting.value = false
    }
  }

  return (
    <div
      onMounted={onMounted}
      onUnmounted={onUnmounted}
      key={props.poll.id}
      className="card"
      watch={deleting}
      bind:visible={() => !deleting.value}
    >
      <h3 className={titleClass}>{titleText}</h3>
      <div style="display:flex; flex-direction:column; gap:1rem">
        <Cinnabun.For
          each={props.options}
          template={(option) => (
            <PollOptionButton option={option} pollData={props} />
          )}
        />
      </div>
      <div>
        <small watch={state} bind:children className="text-muted">
          Total votes: {() => getTotalVotes(state.value)}
        </small>
      </div>
      {props.poll.ownerId === userStore.value?.userId ? (
        <div className="card-footer">
          <hr style="opacity: .3" />
          <IconButton type="button" onclick={handleDelete}>
            <Icons.TrashIcon color="#aaa" color:hover="var(--danger)" />
          </IconButton>
          <IconButton type="button">
            <Icons.EditIcon color="#aaa" color:hover="var(--primary)" />
          </IconButton>
        </div>
      ) : (
        <></>
      )}
    </div>
  )
}
