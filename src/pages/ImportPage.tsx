import { BackupPanel } from '../components/import/BackupPanel'
import { ExcelCategoryImport } from '../components/import/ExcelCategoryImport'
import { StarlingCsvImport } from '../components/import/StarlingCsvImport'

export function ImportPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Import &amp; backup</h2>
      <StarlingCsvImport />
      <BackupPanel />
      <ExcelCategoryImport />
    </div>
  )
}
