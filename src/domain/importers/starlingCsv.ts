export interface StarlingCsvRow {
  date: string // "DD/MM/YYYY"
  counterParty: string
  reference?: string
  amount: number // GBP; negative = money out
  balance?: string // running balance after this transaction, exactly as exported
  spendingCategory: string
}

export interface ParsedStarlingTransaction {
  date: string // ISO "YYYY-MM-DD"
  merchant: string
  amount: number // always positive; `direction` says which way the money moved
  direction: 'in' | 'out'
  spendingCategory: string
  importKey: string
}

export function parseStarlingDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/**
 * Identifies the same transaction across overlapping exports (e.g. weekly exports whose date
 * ranges overlap). The running balance makes this effectively unique: two otherwise identical
 * purchases on the same day still leave different balances behind.
 */
export function starlingImportKey(row: StarlingCsvRow): string {
  return ['starling', row.date, row.counterParty, row.reference ?? '', row.amount, row.balance ?? ''].join('|')
}

/**
 * Converts every exported row, money in as well as money out, so incoming-vs-outgoing views have
 * the full picture. Zero-amount rows (e.g. card verification checks) move no money and are dropped.
 */
export function toStarlingTransactions(rows: StarlingCsvRow[]): ParsedStarlingTransaction[] {
  return rows
    .filter((r) => r.amount !== 0)
    .map((r) => ({
      date: parseStarlingDate(r.date),
      merchant: r.counterParty,
      amount: Math.abs(r.amount),
      direction: r.amount < 0 ? 'out' : 'in',
      spendingCategory: r.spendingCategory,
      importKey: starlingImportKey(r),
    }))
}

export function normalizeCategoryLabel(label: string): string {
  return label.trim().toLowerCase().replace(/[_\s]+/g, ' ')
}

/** Starling's fixed category enum doesn't always read the same as a personal budget label. */
const KNOWN_ALIASES: Record<string, string> = {
  'bills and services': 'bills',
}

/** Lowercased label as a space-joined list of whole words, e.g. "Shopping (Books, etc.)" -> "shopping books etc". */
function toWordPhrase(label: string): string {
  return label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join(' ')
}

/** True when `needle` appears in `haystack` as whole words ("car" is not inside "personal care"). */
function containsPhrase(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${needle} `)
}

/**
 * Best-effort match of a Starling spending category to one of the user's own budget category
 * names. Matches on whole words, never raw substrings, and prefers an exact match over a partial
 * one (e.g. "SHOPPING" matches "Shopping (Books, ...)", but "PERSONAL_CARE" must not match "Car").
 * Returns null when nothing matches, so the caller can prompt for a manual choice instead of
 * silently mis-filing a transaction into the wrong budget.
 */
export function matchCategory(spendingCategory: string, appCategoryNames: string[]): string | null {
  const normalized = normalizeCategoryLabel(spendingCategory)
  const target = toWordPhrase(KNOWN_ALIASES[normalized] ?? normalized)
  const candidates = appCategoryNames.map((name) => ({ name, phrase: toWordPhrase(name) }))

  const exact = candidates.find((c) => c.phrase === target)
  if (exact) return exact.name

  const nameContainsTarget = candidates.find((c) => containsPhrase(c.phrase, target))
  if (nameContainsTarget) return nameContainsTarget.name

  const targetContainsName = candidates.find((c) => containsPhrase(target, c.phrase))
  return targetContainsName?.name ?? null
}
