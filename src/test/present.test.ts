import { describe, expect, it } from 'vitest'
import { hrefFor } from '../screens'

describe('prototype navigation href', () => {
  it('builds a shareable hash without the removed presentation mode', () => {
    expect(hrefFor('propr')).toBe('/#propr')
    expect(hrefFor('notes')).toBe('/#notes')
  })
})
