import * as Cinnabun from "cinnabun"
import { ComponentChildren, ComponentProps } from "cinnabun/types"
import { KeyboardListener, NavigationListener } from "cinnabun/listeners"
import { FadeInOut, Transition } from "cinnabun-transitions"
import "./Modal.css"
import { bodyStyle } from "../../state/global"

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
  large?: boolean
}
export const Modal = (
  { visible, toggle, onclose, gestures = {}, large }: ModalProps,
  children: ComponentChildren
) => {
  const _gestures = { ...defaultGestures, ...gestures }
  const { closeOnNavigate, closeOnClickOutside, closeOnEscape } = _gestures

  return (
    <FadeInOut
      properties={[{ name: "opacity", from: 0, to: 1, ms: 350 }]}
      className="modal-outer"
      tabIndex={-1}
      watch={visible}
      bind:visible={() => {
        if (!visible.value && onclose) onclose()
        if (visible.value) {
          bodyStyle.value = "overflow: hidden;"
        } else {
          bodyStyle.value = ""
        }
        return visible.value
      }}
      onmouseup={(e: MouseEvent) => {
        if (!visible.value || !closeOnClickOutside) return
        const el = e.target as HTMLDivElement
        if (el.className === "modal-outer") toggle()
      }}
    >
      <Transition
        className={"modal" + (large ? " lg" : "")}
        properties={[{ name: "translate", from: "0 -5rem", to: "0 0", ms: 350 }]}
        watch={visible}
        bind:visible={() => visible.value}
      >
        <NavigationListener onCapture={() => closeOnNavigate && toggle()} />
        <KeyboardListener keys={["Escape"]} onCapture={() => closeOnEscape && toggle()} />
        {children}
      </Transition>
    </FadeInOut>
  )
}

export const ModalHeader = (props: ComponentProps, children: ComponentChildren) => {
  return (
    <div className={`modal-header ${props.className}`} {...props}>
      {children}
    </div>
  )
}

export const ModalBody = (props: ComponentProps, children: ComponentChildren) => {
  return (
    <div className={`modal-body ${props.className}`} {...props}>
      {children}
    </div>
  )
}

export const ModalFooter = (props: ComponentProps, children: ComponentChildren) => {
  return (
    <div className={`modal-footer ${props.className}`} {...props}>
      {children}
    </div>
  )
}
