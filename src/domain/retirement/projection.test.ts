import { describe, expect, it } from 'vitest'
import { computeMonthlyTrend, projectRetirementStatus } from './projection'

describe('computeMonthlyTrend', () => {
  it('returns null with fewer than 2 snapshots', () => {
    expect(computeMonthlyTrend([])).toBeNull()
    expect(computeMonthlyTrend([{ date: '2026-01-01', netWorth: 1000 }])).toBeNull()
  })

  it('normalizes deltas by elapsed months for irregular logging gaps', () => {
    // Jan -> Mar (2 months, +2000 => 1000/mo), Mar -> Apr (1 month, +1000 => 1000/mo)
    const trend = computeMonthlyTrend([
      { date: '2026-01-01', netWorth: 10000 },
      { date: '2026-03-01', netWorth: 12000 },
      { date: '2026-04-01', netWorth: 13000 },
    ])
    expect(trend?.monthlyDelta).toBeCloseTo(1000)
    expect(trend?.sampleSize).toBe(2)
  })
})

describe('projectRetirementStatus', () => {
  const goal = { targetAmount: 100_000, targetDate: '2027-01-01' }

  it('reports insufficient-data with zero snapshots', () => {
    expect(projectRetirementStatus([], goal, '2026-01-01')).toEqual({
      status: 'insufficient-data',
      currentNetWorth: undefined,
    })
  })

  it('reports insufficient-data with exactly one snapshot, but still surfaces current net worth', () => {
    const result = projectRetirementStatus([{ date: '2026-01-01', netWorth: 5000 }], goal, '2026-06-01')
    expect(result).toEqual({ status: 'insufficient-data', currentNetWorth: 5000 })
  })

  it('is on-track when the projected trend meets the goal', () => {
    const snapshots = [
      { date: '2026-01-01', netWorth: 90_000 },
      { date: '2026-02-01', netWorth: 92_000 },
    ]
    // trend = 2000/mo, 11 months remaining to 2027-01-01 -> projected = 92000 + 22000 = 114000
    const result = projectRetirementStatus(snapshots, goal, '2026-02-01')
    expect(result.status).toBe('on-track')
    if (result.status !== 'insufficient-data') {
      expect(result.projectedNetWorth).toBeCloseTo(114_000)
      expect(result.actualMonthlyDelta).toBeCloseTo(2000)
      expect(result.requiredMonthlyDelta).toBeCloseTo((100_000 - 92_000) / 11)
    }
  })

  it('is off-track when the projected trend falls short of the goal', () => {
    const snapshots = [
      { date: '2026-01-01', netWorth: 90_000 },
      { date: '2026-02-01', netWorth: 89_000 }, // shrinking
    ]
    const result = projectRetirementStatus(snapshots, goal, '2026-02-01')
    expect(result.status).toBe('off-track')
  })

  it('compares current net worth directly to the goal once the target date has passed, without dividing by zero', () => {
    const snapshots = [
      { date: '2026-01-01', netWorth: 90_000 },
      { date: '2026-02-01', netWorth: 95_000 },
    ]
    const passedGoal = { targetAmount: 100_000, targetDate: '2026-01-15' }
    const result = projectRetirementStatus(snapshots, passedGoal, '2026-02-01')
    expect(result).toMatchObject({ status: 'off-track', monthsRemaining: 0, goalDatePassed: true })

    const metGoal = { targetAmount: 50_000, targetDate: '2026-01-15' }
    const metResult = projectRetirementStatus(snapshots, metGoal, '2026-02-01')
    expect(metResult.status).toBe('on-track')
  })
})
