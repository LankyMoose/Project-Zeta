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
  isCommunityValid: (name: string, desc: string) => {
    if (
      name.length < communityValidation.minCommunityNameLength ||
      name.length > communityValidation.maxCommunityNameLength
    ) {
      return false
    }

    if (
      desc.length < communityValidation.minCommunityDescLength ||
      desc.length > communityValidation.maxCommunityDescLength
    ) {
      return false
    }

    return true
  },
}
