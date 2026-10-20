import { useState, type ChangeEvent } from 'react'
import { exportBackup, getLastBackupAt, recordBackupMade, restoreBackup } from '../../db/backup'
import { backupFileName, parseBackup, type Backup } from '../../db/backupFormat'

function describeAge(iso: string | null): string {
  if (!iso) return 'No backup made on this device yet.'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return `Last backup: ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}.`
}

/** Hands the file to the share sheet on iPhone ("Save to Files"), falling back to a plain download. */
async function saveFile(file: File): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return true
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false
      throw err
    }
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
  return true
}

export function BackupPanel() {
  const [lastBackupAt, setLastBackupAt] = useState(getLastBackupAt())
  const [pendingRestore, setPendingRestore] = useState<Backup | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    setBusy(true)
    setMessage(null)
    try {
      const backup = await exportBackup()
      const file = new File([JSON.stringify(backup)], backupFileName(backup.exportedAt), { type: 'application/json' })
      if (await saveFile(file)) {
        recordBackupMade(backup.exportedAt)
        setLastBackupAt(backup.exportedAt)
      }
    } catch (err) {
      setMessage({ tone: 'error', text: `Backup failed: ${(err as Error).message}` })
    } finally {
      setBusy(false)
    }
  }

  async function handleChooseRestore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMessage(null)
    try {
      setPendingRestore(parseBackup(await file.text()))
    } catch (err) {
      setPendingRestore(null)
      setMessage({ tone: 'error', text: (err as Error).message })
    }
  }

  async function handleConfirmRestore() {
    if (!pendingRestore) return
    setBusy(true)
    try {
      await restoreBackup(pendingRestore)
      setMessage({ tone: 'ok', text: 'Backup restored.' })
      setPendingRestore(null)
    } catch (err) {
      setMessage({ tone: 'error', text: `Restore failed, nothing was changed: ${(err as Error).message}` })
    } finally {
      setBusy(false)
    }
  }

  const pendingCounts = pendingRestore
    ? `${pendingRestore.tables.categories?.length ?? 0} categories, ${pendingRestore.tables.transactions?.length ?? 0} transactions`
    : ''

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-1 text-base font-semibold text-slate-900">Backup</h3>
      <p className="mb-3 text-sm text-slate-500">
        Your data lives only in this browser. Save a backup to Files regularly so nothing is lost if the browser's
        storage is cleared. {describeAge(lastBackupAt)}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Save backup
        </button>
        <label className="cursor-pointer rounded border border-slate-300 px-3 py-1.5 text-sm font-medium">
          Restore from backup…
          <input type="file" accept=".json,application/json" onChange={handleChooseRestore} className="sr-only" />
        </label>
      </div>

      {pendingRestore && (
        <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="text-amber-900">
            This backup is from {new Date(pendingRestore.exportedAt).toLocaleString('en-GB')} ({pendingCounts}).
            Restoring <strong>replaces everything</strong> currently in the app.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleConfirmRestore}
              disabled={busy}
              className="rounded bg-amber-600 px-3 py-1 font-medium text-white disabled:opacity-50"
            >
              Replace with backup
            </button>
            <button type="button" onClick={() => setPendingRestore(null)} className="rounded border border-slate-300 px-3 py-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && <p className={`mt-3 text-sm ${message.tone === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>}
    </div>
  )
}
