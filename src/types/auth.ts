export enum AuthProvider {
  Google = "google",
  Github = "github",
}

export type AuthCallbackState = {
  post?: string
  community?: string
  newpost?: true
  newcommunity?: true
}
