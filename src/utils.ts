export const generateUUID = () => {
  // Public Domain/MIT
  var d = new Date().getTime() //Timestamp
  var d2 = (typeof performance !== "undefined" && performance.now && performance.now() * 1000) || 0 //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0
      d = Math.floor(d / 16)
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0
      d2 = Math.floor(d2 / 16)
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export const truncateText = (text: string, limit: number) => {
  return text.substring(0, limit) + (text.length > limit ? "..." : "")
}

export const formatUTCDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const usePlural = (num: number) => Math.floor(num) !== 1

export const timeSinceDate = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) {
    return `${Math.floor(interval)} year${usePlural(interval) ? "s" : ""} ago`
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return `${Math.floor(interval)} month${usePlural(interval) ? "s" : ""} ago`
  }
  interval = seconds / 86400
  if (interval > 1) {
    return `${Math.floor(interval)} day${usePlural(interval) ? "s" : ""} ago`
  }
  interval = seconds / 3600
  if (interval > 1) {
    return `${Math.floor(interval)} hour${usePlural(interval) ? "s" : ""} ago`
  }
  interval = seconds / 60
  if (interval > 1) {
    return `${Math.floor(interval)} minute${usePlural(interval) ? "s" : ""} ago`
  }
  console.log(interval)
  return `${Math.floor(interval)} seconds ago`
}
export const convertUTCDateToLocalDate = (date: Date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
}
export const timeSinceUTCDate = (date: Date | string) => {
  const utc = convertUTCDateToLocalDate(new Date(date))
  return timeSinceDate(utc)
}

export const isEmail = (str: string) => {
  const emailRegex = /\S+@\S+\.\S+/
  return emailRegex.test(str)
}

export const isUuid = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export const isUrl = (str: string) => {
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/
  return urlRegex.test(str)
}
