import { describe, expect, it } from 'vitest'
import { BEATS, publicCopy } from '../conversation'
import { DASH_RE } from '../copyGuard'
import { PRODUCTS } from '../products'

const FORBIDDEN = [
  /shareholder/i,
  /investor/i,
  /\bAPY\b/,
  /\bAPR\b/,
  /guaranteed/i,
  /equity/i,
  /operating system/i,
  /venture studio/i,
  /accelerator/i,
]

describe('conversation copy', () => {
  it('has five beats with the brief labels', () => {
    expect(BEATS.map((b) => b.label)).toEqual([
      'Who we are',
      'What we ship',
      'How we work',
      'Our roots',
      'For XBG holders',
    ])
  })

  it('contains no dash character in public copy', () => {
    for (const text of publicCopy()) {
      expect(text).not.toMatch(DASH_RE)
    }
  })

  it('does not use prohibited positioning or holder language', () => {
    const blob = publicCopy().join('\n')
    for (const re of FORBIDDEN) {
      expect(blob).not.toMatch(re)
    }
  })

  it('keeps the approved studio position and holder loop', () => {
    const blob = publicCopy().join('\n')
    expect(blob).toContain('XBorg is an AI startup studio.')
    expect(blob).toContain('Stake XBG, take part in missions and campaigns, and join monthly rewards.')
    expect(blob).toContain('Missions are optional. The monthly distribution is not.')
  })

  it('keeps product window copy free of dashes', () => {
    for (const product of PRODUCTS) {
      expect(product.lead).not.toMatch(DASH_RE)
      expect(product.action).not.toMatch(DASH_RE)
      if (product.proof) expect(product.proof).not.toMatch(DASH_RE)
    }
  })

  it('does not reinstate removed production lines', () => {
    const blob = publicCopy().join('\n')
    expect(blob).not.toMatch(/shareholders/)
    expect(blob).not.toMatch(/feeds value back/)
    expect(blob).not.toMatch(/150%/)
    expect(blob).not.toMatch(/1,000,000 XBG/)
    expect(blob).not.toMatch(/\$100M ARR/)
  })
})
