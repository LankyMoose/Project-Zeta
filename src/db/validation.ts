export const pollValidation = {
  minPollDescLength: 6,
  maxPollDescLength: 255,
  minPollOptions: 2,
  minPollOptionDescLength: 1,
  maxPollOptionDescLength: 32,
  isPollValid: (desc: string, options: string[]): boolean => {
    // rewrite the below with early returns

    if (
      desc.length < pollValidation.minPollDescLength ||
      desc.length > pollValidation.maxPollDescLength
    ) {
      return false
    }

    if (options.length < pollValidation.minPollOptions) {
      return false
    }

    return options.every(
      (option) =>
        option.length > pollValidation.minPollOptionDescLength &&
        option.length <= pollValidation.maxPollOptionDescLength
    )
  },
}
