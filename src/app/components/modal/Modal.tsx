import * as Cinnabun from "cinnabun"
import { ComponentChildren, ComponentProps } from "cinnabun/types"
import { ClickOutsideListener, KeyboardListener, NavigationListener } from "cinnabun/listeners"
import { FadeInOut, Transition } from "cinnabun-transitions"
import "./Modal.css"
import { openModalCount, pathStore } from "../../../state/global"

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
  toggle: (e: Event) => void
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

  pathStore.subscribe(() => {
    if (closeOnNavigate && visible.value) toggle(new Event("click"))
  })

  let didMount = false

  return (
    <FadeInOut
      properties={[{ name: "opacity", from: 0, to: 1, ms: 350 }]}
      className="modal-outer"
      tabIndex={-1}
      watch={visible}
      bind:visible={(self) => {
        if (!visible.value && onclose) onclose()
        if (visible.value) {
          didMount = true
        }
        if (self.props.visible !== visible.value && didMount) {
          openModalCount.value += visible.value ? 1 : -1
        }
        return visible.value
      }}
      cancelExit={() => visible.value}
    >
      <ClickOutsideListener
        tag="div"
        className="modal-wrapper"
        onCapture={(e) => {
          if (e.defaultPrevented) return
          if (closeOnClickOutside) {
            e.preventDefault()
            toggle(e)
          }
        }}
      >
        <Transition
          className={"modal" + (large ? " lg" : "")}
          properties={[{ name: "translate", from: "0 -5rem", to: "0 0", ms: 350 }]}
          watch={visible}
          bind:visible={() => visible.value}
          cancelExit={() => visible.value}
        >
          <NavigationListener onCapture={(e) => closeOnNavigate && toggle(e)} />
          <KeyboardListener keys={["Escape"]} onCapture={(_, e) => closeOnEscape && toggle(e)} />
          {children}
        </Transition>
      </ClickOutsideListener>
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
