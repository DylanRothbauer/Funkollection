import { subscriptionGrantsPremium } from './subscriptionEntitlement.js'

export const SHARE_CARD_FORMAT = {
  id: 'square',
  label: 'Square social post',
  width: 1080,
  height: 1080,
}

export const DEFAULT_SHARE_OPTIONS = Object.freeze({
  theme: 'light',
  showDisplayName: false,
  showRecordedValue: false,
  showTopSeries: true,
})

export function hasShareCardAccess({ subscription, subscriptionStatus, isAdmin = false } = {}) {
  if (isAdmin) return true
  if (subscription) return subscriptionGrantsPremium(subscription)
  return subscriptionStatus === 'active' || subscriptionStatus === 'trialing'
}

export function shareCardFilename() {
  return 'funkollection-collection-stats.png'
}

export function safeCollectorName(displayName) {
  const name = typeof displayName === 'string' ? displayName.trim() : ''
  return name || 'Funko Collector'
}

export function applicationAttribution(configuredUrl, currentOrigin) {
  const candidate = configuredUrl || currentOrigin
  try {
    return new URL(candidate).hostname.replace(/^www\./, '')
  } catch {
    return 'Funkollection'
  }
}

export async function exportSvgElementToPng(svgElement, filename = shareCardFilename()) {
  if (!svgElement) throw new Error('Share card preview is unavailable')

  const clone = svgElement.cloneNode(true)
  clone.setAttribute('width', String(SHARE_CARD_FORMAT.width))
  clone.setAttribute('height', String(SHARE_CARD_FORMAT.height))
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml;charset=utf-8',
  })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = await new Promise((resolve, reject) => {
      const exportImage = new Image()
      exportImage.onload = () => resolve(exportImage)
      exportImage.onerror = () => reject(new Error('The share card image could not be rendered'))
      exportImage.src = svgUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = SHARE_CARD_FORMAT.width
    canvas.height = SHARE_CARD_FORMAT.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image export is not supported by this browser')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('The PNG could not be created'))),
        'image/png',
      )
    })
    const downloadUrl = URL.createObjectURL(pngBlob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(downloadUrl)
    return pngBlob
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
