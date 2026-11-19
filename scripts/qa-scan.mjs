// Taste QA defect scan. Measures every review state at each width for the defects the
// taste QA brief lists: overflow, clipped text, overlap, small targets, contrast, console
// errors, keyboard focus and reduced motion.
// Usage: node scripts/qa-scan.mjs <set> [--widths 1440,1024,390] [--only id,id]
// Writes docs/taste-qa/qa-scan-<set>.json and prints a summary. Needs the dev server on 5174.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const argv = process.argv.slice(2)
const option = (name, fallback) => {
  const index = argv.indexOf(`--${name}`)
  if (index === -1) return fallback
  const [, value] = argv.splice(index, 2)
  return value
}
const widths = option('widths', '1440,1024,390').split(',').map(Number)
const only = option('only', '')
const [set = 'before'] = argv
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs', 'taste-qa')
mkdirSync(outDir, { recursive: true })
const baseUrl = 'http://127.0.0.1:5174'
const HEIGHTS = { 1440: 900, 1280: 800, 1024: 768, 390: 844, 320: 640 }

// The review states come from src/screens.ts, so new states are captured too.
function screenIds() {
  const source = readFileSync(join(root, 'src', 'screens.ts'), 'utf8')
  return [...source.matchAll(/\{ id: '([a-z0-9-]+)'/g)].map((match) => match[1])
}

const SCREENS = screenIds().filter((id) => !only || only.split(',').includes(id))

// Runs in the page. Layout, overlap, target size and contrast measurements.
function measure() {
  const out = { overflow: [], clipped: [], truncated: [], covered: [], textOverlap: [], smallTargets: [], contrast: [], hiddenText: [] }
  const vw = innerWidth
  const vh = innerHeight
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
    const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 48)
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${text ? ` "${text}"` : ''}`
  }
  const visible = (el) => {
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none') return false
    if (el.closest('[inert], [aria-hidden="true"], .review-bar, .reviewbar')) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const opacityChain = (el) => {
    let o = 1
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity)
    return o
  }
  const inViewport = (r) => r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh
  // The visible part of an element once every clipping ancestor is applied.
  const clippedRect = (el) => {
    let r = el.getBoundingClientRect()
    let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    for (let n = el.parentElement; n; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (/(hidden|auto|scroll|clip)/.test(s.overflow + s.overflowX + s.overflowY)) {
        const p = n.getBoundingClientRect()
        box = { left: Math.max(box.left, p.left), top: Math.max(box.top, p.top), right: Math.min(box.right, p.right), bottom: Math.min(box.bottom, p.bottom) }
      }
    }
    box.left = Math.max(box.left, 0); box.top = Math.max(box.top, 0)
    box.right = Math.min(box.right, vw); box.bottom = Math.min(box.bottom, vh)
    return box.right - box.left > 2 && box.bottom - box.top > 2 ? box : null
  }

  const all = [...document.querySelectorAll('body *')].filter((el) => !(el instanceof SVGElement) && visible(el))

  // Page level
  const se = document.scrollingElement
  out.page = { scrollWidth: se.scrollWidth, scrollHeight: se.scrollHeight, vw, vh }

  // Overflow and clipping
  for (const el of all) {
    const s = getComputedStyle(el)
    const sideways = el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0
    if (sideways && /(auto|scroll)/.test(s.overflowX)) out.overflow.push({ el: describe(el), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, kind: 'scrolls sideways' })
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!hasText) continue
    if (sideways && s.textOverflow === 'ellipsis') out.truncated.push({ el: describe(el), full: el.textContent.trim().slice(0, 80) })
    else if (sideways && /(hidden|clip)/.test(s.overflowX)) out.clipped.push({ el: describe(el), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth })
    else if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0 && /(hidden|clip)/.test(s.overflowY)) out.clipped.push({ el: describe(el), scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, axis: 'y' })
  }

  // Text that runs outside the window or panel that holds it
  for (const el of all) {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!hasText) continue
    const r = el.getBoundingClientRect()
    const range = document.createRange()
    range.selectNodeContents(el)
    const tr = range.getBoundingClientRect()
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (/(hidden|clip)/.test(s.overflowX)) {
        const p = n.getBoundingClientRect()
        if (tr.right > p.right + 1 || tr.left < p.left - 1) out.clipped.push({ el: describe(el), by: describe(n), textRight: Math.round(tr.right), boxRight: Math.round(p.right) })
        break
      }
      if (/(auto|scroll)/.test(s.overflowX)) break
    }
    if (r.right > vw + 1 && !el.closest('[class*="scroll"], .window-body, .portal-body')) out.overflow.push({ el: describe(el), right: Math.round(r.right), kind: 'past the viewport' })
  }

  // Interactive elements covered by something else, and target size
  const interactive = all.filter((el) => el.matches('a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'))
  for (const el of interactive) {
    const box = clippedRect(el)
    if (!box) continue
    const cx = (box.left + box.right) / 2
    const cy = (box.top + box.bottom) / 2
    const hit = document.elementFromPoint(cx, cy)
    if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) {
      // A modal backdrop or dimmed window covering background controls is expected.
      const expected = hit.closest('.portal-modal-backdrop, .app-window, .window-product, .window-portal, [role="dialog"], .wallet-menu') && !hit.closest('.window-xborg')
      if (!expected || el.closest('[role="dialog"], .portal-modal')) out.covered.push({ el: describe(el), by: describe(hit) })
    }
    const r = el.getBoundingClientRect()
    // WCAG 2.5.8 exempts targets inside a sentence.
    const inline = getComputedStyle(el).display === 'inline' || el.classList.contains('inline-link')
    const onTop = hit && (hit === el || el.contains(hit) || hit.contains(el))
    if (onTop && !inline && (r.width < 24 || r.height < 24) && inViewport(r)) out.smallTargets.push({ el: describe(el), w: Math.round(r.width), h: Math.round(r.height) })
  }

  // Overlapping text blocks (leaf text elements whose boxes intersect)
  const leaves = all.filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && opacityChain(el) > 0.05)
  const textBoxes = leaves.map((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return { el, r: range.getBoundingClientRect() }
  }).filter(({ r }) => r.width > 0 && inViewport(r))
  // Text that is on top at its own centre, so text behind a window does not count.
  const onTopText = textBoxes.filter(({ el, r }) => {
    const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), vw - 1), Math.min(Math.max(r.top + r.height / 2, 0), vh - 1))
    return hit && (el.contains(hit) || hit.contains(el))
  })
  for (let i = 0; i < onTopText.length; i++) {
    for (let j = i + 1; j < onTopText.length; j++) {
      const a = onTopText[i]; const b = onTopText[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
      const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
      if (ix > 2 && iy > 4) out.textOverlap.push({ a: describe(a.el), b: describe(b.el) })
    }
  }

  // Contrast on text that is actually on top at its centre
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
  }
  const over = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 })
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const backdropOf = (el) => {
    const layers = []
    let gradient = false
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.backgroundImage && s.backgroundImage !== 'none') gradient = true
      const c = parse(s.backgroundColor)
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break }
    }
    let base = { r: 9, g: 9, b: 13, a: 1 }
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return { bg: base, gradient }
  }
  for (const { el, r } of textBoxes) {
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    if (cx < 0 || cy < 0 || cx > vw || cy > vh) continue
    const hit = document.elementFromPoint(cx, cy)
    if (!hit || !(el.contains(hit) || hit.contains(el))) continue
    const s = getComputedStyle(el)
    const fg = parse(s.color)
    if (!fg) continue
    const o = opacityChain(el)
    if (o < 0.05) { out.hiddenText.push({ el: describe(el) }); continue }
    const { bg, gradient } = backdropOf(el)
    const ink = over({ ...fg, a: fg.a * o }, bg)
    const L1 = lum(ink); const L2 = lum(bg)
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    const size = parseFloat(s.fontSize)
    const bold = Number(s.fontWeight) >= 700
    const large = size >= 24 || (bold && size >= 18.66)
    const need = large ? 3 : 4.5
    if (ratio < need) out.contrast.push({ el: describe(el), ratio: Math.round(ratio * 100) / 100, need, size, approx: gradient })
  }
  return out
}

const browser = await chromium.launch()
const report = { set, at: new Date().toISOString(), results: [] }

for (const width of widths) {
  const height = HEIGHTS[width] ?? Math.round(width * 0.625)
  for (const id of SCREENS) {
    for (const motion of ['no-preference', 'reduce']) {
      // Reduced motion is checked at the first width only, for every state.
      if (motion === 'reduce' && width !== widths[0]) continue
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: motion })
      const page = await context.newPage()
      const errors = []
      // Motion warns in development when the OS asks for reduced motion. That is expected, not a defect.
      page.on('console', (msg) => {
        if (/Reduced Motion enabled/.test(msg.text())) return
        if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`${msg.type()}: ${msg.text().slice(0, 200)}`)
      })
      page.on('pageerror', (err) => errors.push(`pageerror: ${String(err).slice(0, 200)}`))
      await page.goto(`${baseUrl}/?present=1#${id}`)
      await page.evaluate(() => document.fonts.ready)
      await page.mouse.move(2, Math.round(height / 2))
      await page.waitForTimeout(motion === 'reduce' ? 300 : 1000)

      const result = { id, width, motion, errors }
      if (motion === 'reduce') {
        result.reducedMotion = await page.evaluate(() => {
          const moving = document.getAnimations().filter((a) => a.playState === 'running').map((a) => {
            const t = a.effect && a.effect.target
            const cls = t && typeof t.className === 'string' ? t.className.split(' ')[0] : ''
            return `${t ? t.tagName.toLowerCase() + (cls ? '.' + cls : '') : '?'} ${a.animationName || a.transitionProperty || a.constructor.name}`
          })
          return { running: moving }
        })
        await context.close()
        report.results.push(result)
        continue
      }

      Object.assign(result, await page.evaluate(measure))

      // Keyboard pass: Tab through the state, record each stop and whether a ring shows.
      const stops = []
      await page.evaluate(() => { window.__qaStops = [] })
      for (let i = 0; i < 70; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(60)
        const stop = await page.evaluate(() => {
          const el = document.activeElement
          if (!el || el === document.body) return null
          if (window.__qaStops.includes(el)) return { repeat: true }
          window.__qaStops.push(el)
          // A field may draw its ring on the wrapper, so read the parent too.
          const s = getComputedStyle(el)
          const ps = getComputedStyle(el.parentElement)
          const r = el.getBoundingClientRect()
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
          const label = (el.getAttribute('aria-label') || el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 40)
          const dialog = document.querySelector('[role="dialog"][aria-modal="true"], .portal-modal[role="dialog"]')
          const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1)
          const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1)
          const hit = document.elementFromPoint(cx, cy)
          return {
            el: `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${label ? ` "${label}"` : ''}`,
            index: window.__qaStops.length - 1,
            outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
            shadow: s.boxShadow,
            border: s.borderColor,
            bg: s.backgroundColor,
            parent: `${ps.outlineStyle} ${ps.boxShadow} ${ps.borderColor}`,
            onScreen: r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight && r.width > 0,
            onTop: !!hit && (el.contains(hit) || hit.contains(el)),
            outsideDialog: !!dialog && !dialog.contains(el),
          }
        })
        if (!stop) continue
        if (stop.repeat) break
        stops.push(stop)
      }
      // Compare each stop with its resting style to see whether focus changes anything.
      const rest = await page.evaluate(() => {
        document.activeElement && document.activeElement.blur()
        return window.__qaStops.map((el) => {
          const s = getComputedStyle(el)
          const ps = getComputedStyle(el.parentElement)
          return { outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`, shadow: s.boxShadow, border: s.borderColor, bg: s.backgroundColor, parent: `${ps.outlineStyle} ${ps.boxShadow} ${ps.borderColor}` }
        })
      })
      result.keyboard = stops.map((stop) => {
        const r = rest[stop.index] || {}
        const ring = stop.outline !== r.outline || stop.shadow !== r.shadow || stop.border !== r.border || stop.bg !== r.bg || stop.parent !== r.parent
        return { el: stop.el, ring, onScreen: stop.onScreen, onTop: stop.onTop, outsideDialog: stop.outsideDialog }
      })
      report.results.push(result)
      await context.close()
    }
  }
  console.log(`width ${width} done`)
}
await browser.close()

writeFileSync(join(outDir, `qa-scan-${set}.json`), JSON.stringify(report, null, 1))

// Summary
const lines = []
for (const r of report.results) {
  const issues = []
  if (r.errors.length) issues.push(`console: ${r.errors.join(' | ')}`)
  if (r.motion === 'reduce') {
    if (r.reducedMotion.running.length) issues.push(`running under reduced motion: ${r.reducedMotion.running.slice(0, 4).join(', ')}`)
  } else {
    if (r.page.scrollWidth > r.page.vw || r.page.scrollHeight > r.page.vh) issues.push(`page scrolls: ${r.page.scrollWidth}x${r.page.scrollHeight}`)
    for (const o of r.overflow) issues.push(`overflow ${o.kind}: ${o.el}`)
    for (const c of r.clipped) issues.push(`clipped: ${c.el}${c.by ? ` by ${c.by}` : ''}`)
    for (const c of r.truncated) issues.push(`truncated: ${c.el}`)
    for (const c of r.covered) issues.push(`covered: ${c.el} by ${c.by}`)
    for (const t of r.textOverlap) issues.push(`text overlap: ${t.a} / ${t.b}`)
    for (const t of r.smallTargets) issues.push(`small target ${t.w}x${t.h}: ${t.el}`)
    for (const c of r.contrast) issues.push(`contrast ${c.ratio}:1 (needs ${c.need}${c.approx ? ', gradient behind' : ''}): ${c.el}`)
    for (const k of r.keyboard) {
      if (!k.ring) issues.push(`no focus ring: ${k.el}`)
      if (!k.onScreen) issues.push(`focus off screen: ${k.el}`)
      else if (!k.onTop) issues.push(`focus hidden behind another element: ${k.el}`)
      if (k.outsideDialog) issues.push(`focus escapes dialog: ${k.el}`)
    }
  }
  if (issues.length) lines.push(`${r.id} @${r.width}${r.motion === 'reduce' ? ' reduced motion' : ''}\n  ${[...new Set(issues)].join('\n  ')}`)
}
writeFileSync(join(outDir, `qa-scan-${set}.txt`), lines.join('\n') + '\n')
console.log(lines.join('\n'))
