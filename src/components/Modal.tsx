import * as Cinnabun from "cinnabun"
import { ComponentChildren } from "cinnabun/types"
import { KeyboardListener, NavigationListener } from "cinnabun/listeners"
import { FadeInOut, Transition } from "cinnabun-transitions"
import "./Modal.css"

type ModalGestureProps = {
  closeOnNavigate?: boolean
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
}
const defaultGestures: ModalGestureProps = {
  closeOnNavigate: true,
  closeOnClickOutside: true,
  closeOnEscape: true,
}

type ModalProps = {
  visible: Cinnabun.Signal<boolean>
  toggle: () => void
  onclose?: () => void
  gestures?: ModalGestureProps
}
export const Modal = (
  { visible, toggle, onclose, gestures = {} }: ModalProps,
  children: ComponentChildren
) => {
  const _gestures = { ...defaultGestures, ...gestures }
  const { closeOnNavigate, closeOnClickOutside, closeOnEscape } = _gestures

  return (
    <FadeInOut
      className="modal-outer"
      tabIndex={-1}
      watch={visible}
      bind:visible={() => {
        if (!visible.value && onclose) onclose()
        return visible.value
      }}
      onmouseup={(e: MouseEvent) => {
        if (!visible.value || !closeOnClickOutside) return
        const el = e.target as HTMLDivElement
        if (el.className === "modal-outer") toggle()
      }}
    >
      <Transition
        className="modal"
        properties={[
          { name: "translate", from: "0 -5rem", to: "0 0", ms: 350 },
        ]}
        watch={visible}
        bind:visible={() => visible.value}
      >
        <NavigationListener onCapture={() => closeOnNavigate && toggle()} />
        <KeyboardListener
          keys={["Escape"]}
          onCapture={() => closeOnEscape && toggle()}
        />
        {children}
      </Transition>
    </FadeInOut>
  )
}
