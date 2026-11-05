import { today, writeStore } from './memory'

// What a backup carries. Keys stay out because they are secrets, and Bible text because
// it can be fetched again and some of it may not be stored at all.
const KEPT = ['byheart.progress', 'byheart.structure', 'byheart.place', 'byheart.theme']

interface Backup {
  app: 'by-heart'
  version: 1
  saved: string
  stores: Record<string, string>
}

export const makeBackup = (storage: Storage = localStorage): Backup => ({
  app: 'by-heart',
  version: 1,
  saved: today(),
  stores: Object.fromEntries(KEPT.flatMap((key) => (storage.getItem(key) === null ? [] : [[key, storage.getItem(key)!]]))),
})

export class BackupError extends Error {}

// Returns only the stores a backup may set, each still valid JSON, or throws.
export const readBackup = (text: string): Record<string, string> => {
  let parsed: Partial<Backup>
  try {
    parsed = JSON.parse(text) as Partial<Backup>
  } catch {
    throw new BackupError('That file isn’t a By Heart backup.')
  }
  if (parsed?.app !== 'by-heart' || typeof parsed.stores !== 'object' || !parsed.stores) {
    throw new BackupError('That file isn’t a By Heart backup.')
  }
  if (parsed.version !== 1) throw new BackupError('That backup is from a newer By Heart. Update and try again.')
  const stores = Object.entries(parsed.stores).filter(([key, value]) => {
    if (!KEPT.includes(key) || typeof value !== 'string') return false
    if (key === 'byheart.theme') return value === 'light' || value === 'dark'
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  })
  return Object.fromEntries(stores)
}

// A restore replaces what this browser holds, so a store missing from the backup is cleared.
export const restoreBackup = (stores: Record<string, string>, storage: Storage = localStorage) => {
  KEPT.forEach((key) => {
    if (key in stores) writeStore(key, stores[key])
    else storage.removeItem(key)
  })
}

export const downloadBackup = () => {
  const backup = makeBackup()
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: `by-heart-${backup.saved}.json` })
  link.click()
  URL.revokeObjectURL(url)
}

let askedToKeep = false

// Asks the browser not to clear this site's storage when the disk runs low. Firefox asks
// the reader, so it waits until there is progress to keep, and asks once per visit.
// Browsers may still say no. Safari's week-long sweep spares only home-screen apps.
export const keepStorage = () => {
  if (askedToKeep || !navigator.storage?.persist) return
  askedToKeep = true
  navigator.storage
    .persisted()
    .then((kept) => kept || navigator.storage.persist())
    .catch(() => {})
}
