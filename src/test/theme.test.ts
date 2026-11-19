import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

describe('tokens', () => {
  it('uses the Direction A roles', () => {
    expect(tokens).toMatch(/--x-canvas:\s*#09090d/)
    expect(tokens).toMatch(/--x-surface-1:\s*#121218/)
    expect(tokens).toMatch(/--x-surface-2:\s*#1b1b23/)
    expect(tokens).toMatch(/--x-ink-1:\s*#f4f4f7/)
    expect(tokens).toMatch(/--x-accent:\s*#8572fc/)
    expect(tokens).toMatch(/--base:\s*var\(--x-canvas\)/)
  })

  it('keeps seven type sizes', () => {
    const sizes = tokens.match(/--x-t\d:/g) ?? []
    expect(sizes).toHaveLength(7)
  })

  it('keeps every text ink at WCAG AA contrast on every surface', () => {
    const value = (name: string) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1] ?? ''
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const contrast = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    for (const ink of ['x-ink-1', 'x-ink-2', 'x-ink-3']) {
      for (const surface of ['x-canvas', 'x-surface-1', 'x-surface-2', 'x-surface-3', 'x-bubble-bg']) {
        expect(contrast(value(ink), value(surface)), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('does not load retired type or the lime accent', () => {
    expect(tokens).not.toMatch(/Söhne|Soehne|Inter|#b6ff3b|#c8ff00|#d4ff00/i)
  })
})
