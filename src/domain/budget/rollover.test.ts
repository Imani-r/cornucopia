import { describe, expect, it } from 'vitest'
import { computeBudgetLedger, getEffectiveBaseBudget } from './rollover'

describe('getEffectiveBaseBudget', () => {
  it('returns 0 when no override applies yet', () => {
    expect(getEffectiveBaseBudget([{ effectiveMonth: '2026-03', amount: 500 }], '2026-01')).toBe(0)
  })

  it('picks the most recent override at or before the month', () => {
    const overrides = [
      { effectiveMonth: '2026-01', amount: 400 },
      { effectiveMonth: '2026-03', amount: 500 },
    ]
    expect(getEffectiveBaseBudget(overrides, '2026-02')).toBe(400)
    expect(getEffectiveBaseBudget(overrides, '2026-03')).toBe(500)
    expect(getEffectiveBaseBudget(overrides, '2026-12')).toBe(500)
  })
})

describe('computeBudgetLedger', () => {
  it('first month: rollover-in implicitly starts at 0', () => {
    const ledger = computeBudgetLedger(
      ['2026-01'],
      [{ effectiveMonth: '2026-01', amount: 500 }],
      { '2026-01': 300 },
    )
    expect(ledger).toEqual([
      { month: '2026-01', baseBudget: 500, rolloverIn: 0, effectiveBudget: 500, actualSpend: 300, rolloverOut: 200, logged: true },
    ])
  })

  it('overspend then underspend: deficit reduces next month, surplus carries forward', () => {
    const months = ['2026-01', '2026-02', '2026-03']
    const overrides = [{ effectiveMonth: '2026-01', amount: 500 }]
    const actuals = { '2026-01': 600, '2026-02': 300, '2026-03': 500 }
    const ledger = computeBudgetLedger(months, overrides, actuals)

    expect(ledger[0]).toMatchObject({ effectiveBudget: 500, actualSpend: 600, rolloverOut: -100 })
    expect(ledger[1]).toMatchObject({ rolloverIn: -100, effectiveBudget: 400, actualSpend: 300, rolloverOut: 100 })
    expect(ledger[2]).toMatchObject({ rolloverIn: 100, effectiveBudget: 600, actualSpend: 500, rolloverOut: 100 })
  })

  it('compounds negative rollover unclamped across consecutive overspent months', () => {
    const months = ['2026-01', '2026-02', '2026-03']
    const overrides = [{ effectiveMonth: '2026-01', amount: 200 }]
    const actuals = { '2026-01': 300, '2026-02': 300, '2026-03': 300 }
    const ledger = computeBudgetLedger(months, overrides, actuals)

    expect(ledger[0].rolloverOut).toBe(-100)
    expect(ledger[1].effectiveBudget).toBe(100) // 200 base - 100 carried deficit
    expect(ledger[1].rolloverOut).toBe(-200)
    expect(ledger[2].effectiveBudget).toBe(0) // 200 base - 200 carried deficit
    expect(ledger[2].rolloverOut).toBe(-300) // deficit keeps compounding, no floor at 0
  })

  it('treats a month with no override yet as a $0 budget', () => {
    const ledger = computeBudgetLedger(['2026-01'], [], { '2026-01': 50 })
    expect(ledger[0]).toMatchObject({ baseBudget: 0, effectiveBudget: 0, rolloverOut: -50 })
  })

  it('mid-stream budget change only affects months at/after the new override', () => {
    const months = ['2026-01', '2026-02', '2026-03']
    const overrides = [
      { effectiveMonth: '2026-01', amount: 400 },
      { effectiveMonth: '2026-03', amount: 600 },
    ]
    const actuals = { '2026-01': 400, '2026-02': 400, '2026-03': 400 }
    const ledger = computeBudgetLedger(months, overrides, actuals)

    expect(ledger[0].baseBudget).toBe(400)
    expect(ledger[1].baseBudget).toBe(400) // unaffected by the future change
    expect(ledger[2].baseBudget).toBe(600)
  })

  it('flags an unlogged month distinctly while still carrying its (0-spend) rollover forward', () => {
    const months = ['2026-01', '2026-02']
    const overrides = [{ effectiveMonth: '2026-01', amount: 500 }]
    const actuals = { '2026-01': 500 } // 2026-02 never logged
    const ledger = computeBudgetLedger(months, overrides, actuals)

    expect(ledger[1]).toMatchObject({ logged: false, actualSpend: 0, effectiveBudget: 500, rolloverOut: 500 })
  })

  it('a reset month forces rollover-in to 0 regardless of prior history', () => {
    const months = ['2026-01', '2026-02']
    const overrides = [{ effectiveMonth: '2026-01', amount: 500 }]
    const actuals = { '2026-01': 700, '2026-02': 500 }
    const ledger = computeBudgetLedger(months, overrides, actuals, new Set(['2026-02']))

    expect(ledger[0].rolloverOut).toBe(-200)
    expect(ledger[1]).toMatchObject({ rolloverIn: 0, effectiveBudget: 500, rolloverOut: 0 })
  })
})
