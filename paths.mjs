const allowed = /\.(?:png|jpe?g|gif|webp|bmp|tiff?|avif|mp4|mov|mkv|webm|avi|m4v|pdf|docx?|xlsx?|pptx?|odt|ods|odp)$/i

export function webAddress(href) {
  if (typeof href !== 'string' || !/^https?:\/\//i.test(href) || /[\x00-\x20\x7f]/.test(href)) return undefined
  try {
    const url = new URL(href)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname && !url.username && !url.password ? url.href : undefined
  } catch { return undefined }
}

export function candidate(href) {
  if (typeof href !== 'string' || !href || /[\x00-\x1f]/.test(href)) return undefined
  let value = href
  if (/^file:/i.test(value)) {
    try {
      const url = new URL(value)
      if (url.hostname || url.search || url.hash) return undefined
      value = decodeURIComponent(url.pathname).replace(/^\/(?=[a-z]:)/i, '')
    } catch { return undefined }
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value)) return undefined
  if (/^(?:\\\\|\/\/|\\\?|\\\.)/.test(value) || value.includes(':', 2)) return undefined
  if (!allowed.test(value)) return undefined
  return value
}
