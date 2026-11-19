import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TOKEN_EXCEPTIONS } from '../tokenExceptions'

// Acceptance check 11: no colour, font size, spacing, radius or shadow value
// appears outside the tokens, except the exceptions documented on #system.
const STYLES = resolve(process.cwd(), 'src/styles')
const FILES = readdirSync(STYLES).filter((file) => file.endsWith('.css') && file !== 'tokens.css')


type Violation = { file: string; line: number; text: string; kind: string }

const COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\bcolor-mix\(/i
const SPACING_PROPS = /^(padding|margin|gap|row-gap|column-gap)(-|$)/
const RAW_LENGTH = /(?<![\w-])(?!0px)(\d*\.?\d+)px\b/

function stripVars(value: string) {
  // Values inside var() fallbacks are tokens by definition.
  return value.replace(/var\([^()]*(\([^()]*\)[^()]*)*\)/g, 'VAR')
}

function scan(file: string): Violation[] {
  const text = readFileSync(resolve(STYLES, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  const out: Violation[] = []
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim()
    const decl = line.match(/^([a-z-]+)\s*:\s*(.+?);?$/)
    if (!decl || line.startsWith('--')) return
    const [, prop, value] = decl
    const bare = stripVars(value)
    const push = (kind: string) => {
      if (TOKEN_EXCEPTIONS.some((e) => e.file === file && e.match.test(line))) return
      out.push({ file, line: i + 1, text: line, kind })
    }
    if (COLOUR.test(bare)) push('colour')
    if (prop === 'font-size' && !/^(VAR|inherit|100%)$/.test(bare)) push('font size')
    if (SPACING_PROPS.test(prop) && RAW_LENGTH.test(bare.replace(/\b[12]px\b/g, ''))) push('spacing')
    if (/radius$/.test(prop) && RAW_LENGTH.test(bare)) push('radius')
    if (prop === 'box-shadow' && !/^(none|VAR)$/.test(bare) && !/VAR/.test(bare)) push('shadow')
  })
  return out
}

describe('design tokens', () => {
  it('every style value comes from a token or a documented exception', () => {
    const violations = FILES.flatMap(scan)
    expect(violations.map((v) => `${v.file}:${v.line} ${v.kind}: ${v.text}`)).toEqual([])
  })
})
