import * as Cinnabun from "cinnabun"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../Modal"
import { authModalOpen, authModalState } from "../../state"
import { Button } from "../Button"
import { GoogleIcon } from "../icons/auth/GoogleIcon"
import { GithubIcon } from "../icons/auth/GithubIcon"

const AuthModalProviderList = () => {
  const options = [
    {
      title: "Google",
      icon: GoogleIcon,
    },
    {
      title: "Github",
      icon: GithubIcon,
    },
  ]

  const handleOptionClick = (option: (typeof options)[0]) => {
    window.location.href = `/login/${option.title.toLowerCase()}`
  }

  return (
    <div className="flex gap flex-column text-center">
      {options.map((option) => (
        <a
          href={`/login/${option.title.toLowerCase()}`}
          className="btn flex gap-sm p-3"
          onclick={(e: Event) => {
            e.preventDefault()
            handleOptionClick(option)
          }}
        >
          <option.icon />
          <span>Continue with {option.title}</span>
        </a>
      ))}
    </div>
  )
}

export const AuthModal = () => {
  return (
    <Modal visible={authModalOpen} toggle={() => (authModalOpen.value = false)}>
      <ModalHeader>
        <h4 className="m-0">{() => authModalState.value.title}</h4>
      </ModalHeader>
      <ModalBody style="line-height:1.3rem">
        <small className="text-muted m-0">
          <i>{() => authModalState.value.message}</i>
        </small>
        <br />
        <br />
        <div>
          <AuthModalProviderList />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          className="btn btn-secondary hover-animate"
          onclick={() => (authModalOpen.value = false)}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
