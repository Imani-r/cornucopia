export interface Category {
  id: string
  name: string
  color?: string
  archived: boolean
  createdAt: string
}

export interface BudgetOverrideRecord {
  id: string
  categoryId: string
  effectiveMonth: string // "YYYY-MM"
  amount: number
  createdAt: string
}

export interface TransactionRecord {
  id: string
  /** The budget category this counts against. Only spending mapped to a budget has one;
   *  money in and spending you chose to skip are stored without it. */
  categoryId?: string
  date: string // ISO date
  amount: number // always positive
  /** Absent on manual monthly entries, which are always spending. */
  direction?: 'in' | 'out'
  kind: 'lump_sum' | 'itemized'
  merchant?: string
  /** The bank's own category label, e.g. Starling's "EATING_OUT". */
  bankCategory?: string
  note?: string
  /** Stable identity of the source row in a bank export, so re-importing it is a no-op. */
  importKey?: string
  createdAt: string
}

/** A remembered choice of which budget category a bank's own spending category files into. */
export interface CategoryMappingRecord {
  spendingCategory: string // e.g. Starling's "EATING_OUT"
  target: string // a Category id, or SKIP_MAPPING
}

export const SKIP_MAPPING = '__skip__'

export interface NetWorthSnapshotRecord {
  id: string
  date: string // ISO date
  netWorth: number
  note?: string
}

export interface RetirementGoalRecord {
  id: string
  name: string
  targetAmount: number
  targetDate: string // ISO date
  updatedAt: string
}

export interface SubscriptionCandidateRecord {
  id: string
  merchantNormalized: string
  categoryId?: string
  amountApprox: number
  cadenceDays: number
  occurrences: number
  lastSeenDate: string
  nextExpectedDate: string
  status: 'candidate' | 'confirmed' | 'dismissed'
}
