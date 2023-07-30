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

export const timeSinceDate = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) {
    return `${Math.floor(interval)} year${Math.floor(interval) > 1 ? "s" : ""} ago`
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return `${Math.floor(interval)} month${Math.floor(interval) > 1 ? "s" : ""} ago`
  }
  interval = seconds / 86400
  if (interval > 1) {
    return `${Math.floor(interval)} day${Math.floor(interval) > 1 ? "s" : ""} ago`
  }
  interval = seconds / 3600
  if (interval > 1) {
    return `${Math.floor(interval)} hour${Math.floor(interval) > 1 ? "s" : ""} ago`
  }
  interval = seconds / 60
  if (interval > 1) {
    return `${Math.floor(interval)} minute${Math.floor(interval) > 1 ? "s" : ""} ago`
  }
  return `${Math.floor(interval)} second${Math.floor(interval) > 1 ? "s" : ""} ago`
}
