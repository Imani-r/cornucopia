import { monthsBetween } from '../shared/month'

export interface NetWorthSnapshot {
  date: string // ISO date
  netWorth: number
}

export interface RetirementGoal {
  targetAmount: number
  targetDate: string // ISO date
}

export interface MonthlyTrend {
  monthlyDelta: number
  sampleSize: number
}

export type RetirementProjection =
  | { status: 'insufficient-data'; currentNetWorth?: number }
  | {
      status: 'on-track' | 'off-track'
      currentNetWorth: number
      projectedNetWorth: number
      actualMonthlyDelta: number
      requiredMonthlyDelta: number
      monthsRemaining: number
      sampleSize: number
      goalDatePassed?: boolean
    }

/**
 * Average dollar change per month across the trailing snapshots, normalized by the
 * actual elapsed months between each pair so irregular logging cadence doesn't skew it.
 * Uses absolute dollars rather than a percentage, since percentage growth is unstable
 * near a zero or negative net worth.
 */
export function computeMonthlyTrend(snapshots: NetWorthSnapshot[], trailingMonths = 12): MonthlyTrend | null {
  if (snapshots.length < 2) return null

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  const windowed = sorted.slice(-Math.min(trailingMonths + 1, sorted.length))

  const deltas: number[] = []
  for (let i = 1; i < windowed.length; i++) {
    const prev = windowed[i - 1]
    const curr = windowed[i]
    const elapsedMonths = monthsBetween(prev.date, curr.date) || 1
    deltas.push((curr.netWorth - prev.netWorth) / elapsedMonths)
  }

  const monthlyDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
  return { monthlyDelta, sampleSize: deltas.length }
}

export function projectRetirementStatus(
  snapshots: NetWorthSnapshot[],
  goal: RetirementGoal,
  today: string,
): RetirementProjection {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted.at(-1)

  if (!latest || sorted.length < 2) {
    return { status: 'insufficient-data', currentNetWorth: latest?.netWorth }
  }

  const trend = computeMonthlyTrend(sorted)!
  const monthsRemaining = monthsBetween(today, goal.targetDate)

  if (monthsRemaining <= 0) {
    return {
      status: latest.netWorth >= goal.targetAmount ? 'on-track' : 'off-track',
      currentNetWorth: latest.netWorth,
      projectedNetWorth: latest.netWorth,
      actualMonthlyDelta: trend.monthlyDelta,
      requiredMonthlyDelta: 0,
      monthsRemaining: 0,
      sampleSize: trend.sampleSize,
      goalDatePassed: true,
    }
  }

  const projectedNetWorth = latest.netWorth + trend.monthlyDelta * monthsRemaining
  const requiredMonthlyDelta = (goal.targetAmount - latest.netWorth) / monthsRemaining

  return {
    status: projectedNetWorth >= goal.targetAmount ? 'on-track' : 'off-track',
    currentNetWorth: latest.netWorth,
    projectedNetWorth,
    actualMonthlyDelta: trend.monthlyDelta,
    requiredMonthlyDelta,
    monthsRemaining,
    sampleSize: trend.sampleSize,
  }
}
