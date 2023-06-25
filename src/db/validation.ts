export const pollValidation = {
  minPollDescLength: 1,
  maxPollDescLength: 255,
  minPollOptions: 2,
  minPollOptionDescLength: 1,
  maxPollOptionDescLength: 32,
  isPollValid: (desc: string, options: string[]): boolean => {
    if (
      desc.length < pollValidation.minPollDescLength ||
      desc.length > pollValidation.maxPollDescLength
    ) {
      return false
    }

    if (options.length < pollValidation.minPollOptions) {
      return false
    }
    if (
      options.some(
        (option) =>
          option.length < pollValidation.minPollOptionDescLength ||
          option.length > pollValidation.maxPollOptionDescLength
      )
    ) {
      return false
    }
    return true
  },
}

export const communityValidation = {
  minCommunityNameLength: 6,
  maxCommunityNameLength: 128,
  minCommunityDescLength: 0,
  maxCommunityDescLength: 255,
  isCommunityNameValid: (name: string | undefined) => {
    if (!name) return false
    if (
      name.length < communityValidation.minCommunityNameLength ||
      name.length > communityValidation.maxCommunityNameLength
    ) {
      return false
    }

    if (!/^[a-zA-Z0-9- ]*$/.test(name)) {
      return false
    }
    return true
  },
  isCommunityValid: (name: string | undefined, desc: string | undefined) => {
    if (!desc) return false
    if (!communityValidation.isCommunityNameValid(name)) return false
    if (
      desc.length < communityValidation.minCommunityDescLength ||
      desc.length > communityValidation.maxCommunityDescLength
    ) {
      return false
    }

    return true
  },
}

export const postValidation = {
  minPostTitleLength: 1,
  maxPostTitleLength: 128,
  minPostContentLength: 1,
  maxPostContentLength: 2048,
  isPostValid: (title: string, content: string) => {
    if (
      title.length < postValidation.minPostTitleLength ||
      title.length > postValidation.maxPostTitleLength
    ) {
      return false
    }

    if (
      content.length < postValidation.minPostContentLength ||
      content.length > postValidation.maxPostContentLength
    ) {
      return false
    }

    return true
  },
}

export const commentValidation = {
  minCommentContentLength: 1,
  maxCommentContentLength: 255,
  isCommentValid: (content: string) => {
    if (
      content.length < commentValidation.minCommentContentLength ||
      content.length > commentValidation.maxCommentContentLength
    ) {
      return false
    }

    return true
  },
}
