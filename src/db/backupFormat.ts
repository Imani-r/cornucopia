import { format } from 'date-fns'

export const BACKUP_APP_ID = 'finance-dashboard'
export const BACKUP_FORMAT_VERSION = 1

export interface Backup {
  app: typeof BACKUP_APP_ID
  formatVersion: number
  exportedAt: string // ISO timestamp
  tables: Record<string, unknown[]>
}

/** Named by the local calendar date (not UTC), so a backup made just after midnight carries today's date. */
export function backupFileName(exportedAt: string): string {
  return `finance-backup-${format(new Date(exportedAt), 'yyyy-MM-dd')}.json`
}

/** Parses and sanity-checks a backup file, throwing a readable error for anything that isn't one. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("This file isn't valid JSON, so it can't be a backup from this app.")
  }

  const candidate = data as Partial<Backup>
  if (!candidate || typeof candidate !== 'object' || candidate.app !== BACKUP_APP_ID) {
    throw new Error("This file isn't a backup from this app.")
  }
  if (typeof candidate.formatVersion !== 'number' || candidate.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new Error('This backup was made by a newer version of the app.')
  }
  if (!candidate.tables || typeof candidate.tables !== 'object' || Array.isArray(candidate.tables)) {
    throw new Error('This backup has no data tables in it.')
  }
  for (const [name, rows] of Object.entries(candidate.tables)) {
    if (!Array.isArray(rows)) throw new Error(`The "${name}" section of this backup is damaged.`)
  }

  return candidate as Backup
}
