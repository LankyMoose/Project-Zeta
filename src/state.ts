import { Cinnabun, Component, createSignal } from "cinnabun"
import { useRequestData } from "cinnabun/ssr"
import { PublicUser } from "./types/user"

const isClient = Cinnabun.isClient

export const pathStore = createSignal(isClient ? window.location.pathname : "/")

const parseCookie = (str: string) =>
  str
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim())
      return acc
    }, {} as Record<string, any>)

const getUserDataFromCookie = (): PublicUser | null => {
  console.log("getUserDataFromCookie", window.document.cookie)
  if (!window.document.cookie) return null
  const { user } = parseCookie(window.document.cookie)
  return user ?? null
}

export const userStore = createSignal<PublicUser | null>(
  isClient ? getUserDataFromCookie() : null
)

export const getUser = (self: Component) =>
  useRequestData<PublicUser | null>(self, "data.user", userStore.value)

export const isAuthenticated = (self: Component) => !!getUser(self)
export const isNotAuthenticated = (self: Component) => !getUser(self)
