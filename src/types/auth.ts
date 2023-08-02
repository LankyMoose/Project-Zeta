export enum AuthProvider {
  Google = "google",
  Github = "github",
}

export type AuthModalCallbackState = {
  view?: {
    community?: string
    post?: string
  }
  create?: {
    community?: true
    post?: true
  }
}

export type AuthModalCallbackStateSerialized = {
  viewpost?: string
  viewcommunity?: string
  createpost?: true
  createcommunity?: true
}
