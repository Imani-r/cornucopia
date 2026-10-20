import { db } from './db'
import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION, type Backup } from './backupFormat'

const LAST_BACKUP_KEY = 'lastBackupAt'

export async function exportBackup(): Promise<Backup> {
  const tables: Record<string, unknown[]> = {}
  for (const table of db.tables) {
    tables[table.name] = await table.toArray()
  }
  return { app: BACKUP_APP_ID, formatVersion: BACKUP_FORMAT_VERSION, exportedAt: new Date().toISOString(), tables }
}

/** Replaces everything in the database with the backup's contents, all-or-nothing. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
      await table.bulkAdd(backup.tables[table.name] ?? [])
    }
  })
}

export function recordBackupMade(at: string): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, at)
  } catch {
    // Storage can be unavailable (e.g. private browsing); the reminder is a nicety, not essential.
  }
}

export function getLastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}
