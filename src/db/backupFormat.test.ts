import { describe, expect, it } from 'vitest'
import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION, backupFileName, parseBackup } from './backupFormat'

const valid = {
  app: BACKUP_APP_ID,
  formatVersion: BACKUP_FORMAT_VERSION,
  exportedAt: '2026-10-21T09:30:00.000Z',
  tables: { categories: [{ id: 'c1', name: 'Rent' }], transactions: [] },
}

describe('parseBackup', () => {
  it('accepts a backup produced by this app', () => {
    expect(parseBackup(JSON.stringify(valid))).toEqual(valid)
  })

  it('rejects text that is not JSON', () => {
    expect(() => parseBackup('Date,Counter Party\n')).toThrow(/isn't valid JSON/)
  })

  it('rejects JSON that is not one of our backups', () => {
    expect(() => parseBackup(JSON.stringify({ hello: 'world' }))).toThrow(/isn't a backup from this app/)
  })

  it('rejects a backup from a newer format version', () => {
    expect(() => parseBackup(JSON.stringify({ ...valid, formatVersion: BACKUP_FORMAT_VERSION + 1 }))).toThrow(/newer version/)
  })

  it('rejects a backup whose table data is damaged', () => {
    expect(() => parseBackup(JSON.stringify({ ...valid, tables: { categories: 'oops' } }))).toThrow(/damaged/)
  })
})

describe('backupFileName', () => {
  it('names the file by the local calendar date of the export', () => {
    // Built from local time, so the expectation holds in any time zone.
    const justAfterLocalMidnight = new Date(2026, 9, 21, 0, 30).toISOString()
    expect(backupFileName(justAfterLocalMidnight)).toBe('finance-backup-2026-10-21.json')
  })
})
