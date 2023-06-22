import * as Cinnabun from "cinnabun"
import { Portal } from "../Portal"
import { Button } from "../Button"
import { Modal } from "../Modal"
import { userStore, isAuthenticated } from "../../state"
import { createPoll } from "../../client/actions/polls"
import { KeyboardListener } from "cinnabun/listeners"
import "./PollCreator.css"
import { addNotification } from "../Notifications"
import { EllipsisLoader } from "../loaders/Ellipsis"
import { pollValidation } from "../../db/validation"

const loading = Cinnabun.createSignal(false)
const modalOpen = Cinnabun.createSignal(false)
const formState = Cinnabun.createSignal<{
  desc: string
  newOptionText: string
}>({
  desc: "",
  newOptionText: "",
})

const options = Cinnabun.createSignal<{ id: string; value: string }[]>([])
const optionExists = (value: string) => {
  return !!options.value.find((o) => o.value === value)
}

const addOption = () => {
  const { newOptionText } = formState.value
  if (!newOptionText) return
  if (optionExists(newOptionText)) return
  options.value.push({
    id: (options.value.length + performance.now()).toString(),
    value: newOptionText,
  })
  options.notify()
  formState.value.newOptionText = ""
  formState.notify()
}

const removeOption = (id: string) => {
  const idx = options.value.findIndex((o) => o.id === id)
  options.value.splice(idx, 1)
  options.notify()
}

const Options = () => (
  <div>
    <h4 className="m-0">Options</h4>
    <br />
    <div className="flex flex-column gap">
      <ul
        className="option-list"
        watch={options}
        bind:visible={() => options.value.length > 0}
      >
        <Cinnabun.For
          each={options}
          template={(item) => {
            return (
              <li key={item.id} className="flex gap align-items-center">
                <span className="text-sm">{item.value}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-danger hover-animate"
                  onclick={() => removeOption(item.id)}
                  watch={loading}
                  bind:disabled={() => loading.value}
                >
                  Remove
                </button>
              </li>
            )
          }}
        />
      </ul>
    </div>
    <br watch={options} bind:visible={() => options.value.length > 0} />
    <div className="flex gap">
      <KeyboardListener keys={["Enter"]} onCapture={addOption}>
        <input
          watch={[formState, loading]}
          bind:value={() => formState.value.newOptionText}
          bind:disabled={() => loading.value}
          oninput={(e: Event) => {
            const tgt = e.target as HTMLInputElement
            formState.value.newOptionText = tgt.value
            formState.notify()
          }}
          className="text-sm w-100"
          type="text"
        />
        <Button
          className="btn btn-secondary hover-animate text-sm"
          type="button"
          watch={[formState, options]}
          bind:disabled={() =>
            !formState.value.newOptionText ||
            optionExists(formState.value.newOptionText)
          }
          onclick={addOption}
        >
          Add
        </Button>
      </KeyboardListener>
    </div>
  </div>
)

export const PollCreator = () => {
  const resetForm = () => {
    formState.value = { desc: "", newOptionText: "" }
    options.value = []
  }
  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    loading.value = true
    const { desc } = formState.value
    try {
      const res = await createPoll({
        desc,
        options: options.value.map((o) => o.value),
      })
      console.log("handleSubmit", res)
      addNotification({
        type: "success",
        text: "Poll created successfully",
      })
      resetForm()
      modalOpen.value = false
    } catch (error) {
      addNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong",
      })
    }
    loading.value = false
  }
  const handleTitleChange = (e: KeyboardEvent) => {
    const tgt = e.target as HTMLInputElement
    formState.value.desc = tgt.value
    formState.notify()
  }

  const isFormInvalid = () =>
    !pollValidation.isPollValid(
      formState.value.desc,
      options.value.map((o) => o.value)
    )

  return (
    <>
      <Button
        watch={userStore}
        bind:visible={isAuthenticated}
        className="btn btn-primary hover-animate text-rg"
        onclick={() => (modalOpen.value = true)}
      >
        Create Poll
      </Button>
      <Portal>
        <Modal
          toggle={() => (modalOpen.value = !modalOpen.value)}
          visible={modalOpen}
        >
          <form disabled onsubmit={handleSubmit}>
            <div className="modal-header">
              <h3>Create Poll</h3>
            </div>
            <div className="modal-body flex flex-column gap">
              <textarea
                className="text-sm w-100"
                watch={[formState, loading]}
                bind:disabled={() => loading.value}
                bind:value={() => formState.value.desc}
                oninput={handleTitleChange}
                placeholder="Title"
                onMounted={(self) => self.element?.focus()}
              />
              <hr className="w-100" style="opacity:.15" />
              <Options />
            </div>
            <div className="modal-footer">
              <Button
                className="btn btn-secondary hover-animate text-rg"
                type="button"
                watch={[formState, options, loading]}
                bind:disabled={() => loading.value}
                onclick={() => {
                  modalOpen.value = false
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                className="btn btn-primary hover-animate text-rg"
                watch={[formState, options, loading]}
                bind:disabled={() => {
                  if (loading.value) return true
                  return isFormInvalid()
                }}
              >
                Create
                <EllipsisLoader
                  watch={loading}
                  bind:visible={() => loading.value}
                />
              </Button>
            </div>
          </form>
        </Modal>
      </Portal>
    </>
  )
}
