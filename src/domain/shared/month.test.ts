import { describe, expect, it } from 'vitest'
import { addMonths, enumerateMonths, monthsBetween } from './month'

describe('addMonths', () => {
  it('rolls over the year boundary', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })
})

describe('enumerateMonths', () => {
  it('returns a contiguous ascending range spanning a year boundary', () => {
    expect(enumerateMonths('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
  })

  it('returns an empty array when start is after end', () => {
    expect(enumerateMonths('2026-05', '2026-01')).toEqual([])
  })
})

describe('monthsBetween', () => {
  it('counts calendar months regardless of day-of-month', () => {
    expect(monthsBetween('2026-01-31', '2026-02-01')).toBe(1)
    expect(monthsBetween('2026-01-01', '2026-01-31')).toBe(0)
  })
})
