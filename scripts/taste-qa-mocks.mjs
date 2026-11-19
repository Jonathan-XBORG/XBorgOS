// Taste QA concept proposals, rendered as mock screenshots. Nothing here changes the
// prototype: each mock loads a review state, injects token-based CSS and small DOM moves,
// and photographs the result. If Gauthier clears a proposal, it is built properly in Q2.
// Usage: node scripts/taste-qa-mocks.mjs [p1,p2,...]   Needs the dev server on 5174.
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'review-shots', 'taste-qa', 'proposals')
mkdirSync(outDir, { recursive: true })
const only = (process.argv[2] ?? '').split(',').filter(Boolean)
const base = 'http://127.0.0.1:5174/?present=1'
const HEIGHTS = { 1440: 900, 1024: 768, 390: 844 }

const browser = await chromium.launch()

async function open(width, id) {
  const page = await browser.newPage({ viewport: { width, height: HEIGHTS[width] } })
  await page.goto(`${base}#${id}`)
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(2, 400)
  await page.waitForTimeout(900)
  return page
}

async function scrollPortal(page, selector) {
  await page.evaluate((sel) => {
    const body = document.querySelector('.portal-body')
    const target = document.querySelector(sel)
    if (!body || !target) return
    body.scrollTop = target.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 24
  }, selector)
  await page.waitForTimeout(200)
}

// P1. Portal figures first: the holder's position leads Home, the claimable amount leads Rewards.
const P1_CSS = `
  .home-page .active-heading .portal-kicker { display: none; }
  .season-panel > .section-heading-row { display: none; }
  .season-panel .season-metrics {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: var(--x-space-6) var(--x-space-8) !important;
    margin-top: 0 !important;
  }
  .season-panel .season-metrics > div { padding-left: 0 !important; box-shadow: none !important; }
  .season-panel .season-metrics > [data-metric="stake"] { grid-column: 1 / 3; }
  .season-panel .season-metrics > [data-metric="stake"] strong { font-size: var(--x-t1) !important; line-height: var(--x-l1) !important; }
  .season-panel .season-metrics > .season-pool {
    grid-column: 3; display: flex; flex-direction: column-reverse; justify-content: flex-end; align-items: flex-end;
    gap: var(--x-space-1); text-align: right;
  }
  .season-panel .season-metrics > .season-pool span { color: var(--x-ink-3); font-size: var(--x-t7); line-height: var(--x-l7); }
  .season-panel .season-metrics > .season-pool strong { font-family: var(--x-figure-font); font-size: var(--x-t3); line-height: var(--x-l3); font-weight: var(--x-figure-weight); }
  .home-page [data-section] .section-heading-row .portal-kicker { display: none; }
  .activity-dot { background: var(--x-ink-3) !important; }
  .rewards-page .active-heading .portal-kicker { display: none; }
  .rewards-page .claim-hero { display: grid; justify-items: end; gap: var(--x-space-2); text-align: right; }
  .rewards-page .claim-hero span { color: var(--x-ink-3); font-size: var(--x-t7); line-height: var(--x-l7); }
  .rewards-page .claim-hero strong { font-family: var(--x-figure-font); font-size: var(--x-t1); line-height: var(--x-l1); font-weight: var(--x-figure-weight); letter-spacing: var(--x-figure-tracking); }
  .rewards-page .claim-hero .btn { margin-top: var(--x-space-2); }
  .rewards-page .reward-metrics { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: var(--x-space-6) !important; }
  .rewards-page .reward-metrics > div { padding-left: 0 !important; box-shadow: none !important; grid-column: auto !important; }
  .rewards-page .reward-metrics > [data-reward="claimable"] { display: none; }
  .rewards-page [class^="reward-"] .section-heading-row .portal-kicker { display: none; }
  @container portal-body (max-width: 560px) {
    .season-panel .season-metrics { grid-template-columns: 1fr 1fr !important; }
    .season-panel .season-metrics > [data-metric="stake"] { grid-column: 1 / -1; }
    .season-panel .season-metrics > .season-pool { grid-column: auto; order: 5; align-items: flex-start; text-align: left; }
    .rewards-page .claim-hero { justify-items: start; text-align: left; }
    .rewards-page .reward-metrics { grid-template-columns: 1fr 1fr !important; }
  }
`
async function p1() {
  for (const width of [1440, 390]) {
    const page = await open(width, 'portal-home')
    await page.addStyleTag({ content: P1_CSS })
    await page.evaluate(() => {
      const metrics = document.querySelector('.season-metrics')
      const pool = document.querySelector('.season-pool')
      if (metrics && pool) metrics.insertBefore(pool, metrics.children[1])
      const poolLabel = pool?.querySelector('span')
      if (poolLabel) poolLabel.textContent = 'Reward pool'
      const mission = document.querySelector('[data-section="mission"] h2')
      if (mission) mission.textContent = 'Recommended mission'
    })
    await page.waitForTimeout(150)
    await page.screenshot({ path: join(outDir, `p1-${width}-home.png`) })
    await page.close()

    const rewards = await open(width, 'portal-rewards')
    await rewards.addStyleTag({ content: P1_CSS })
    await rewards.evaluate(() => {
      const heading = document.querySelector('.rewards-page .active-heading')
      const button = heading?.querySelector('.btn')
      const claimable = document.querySelector('[data-reward="claimable"] strong')?.textContent
      if (!heading || !button) return
      const hero = document.createElement('div')
      hero.className = 'claim-hero'
      hero.innerHTML = `<span>Claimable rewards</span><strong>${claimable}</strong>`
      hero.appendChild(button)
      heading.appendChild(hero)
    })
    await rewards.waitForTimeout(150)
    await rewards.screenshot({ path: join(outDir, `p1-${width}-rewards.png`) })
    await rewards.close()
  }
}

// P2. The chat reads as a conversation: beat labels become quiet centred separators, with no
// index numbers and no rule, and bubbles that wrap shrink to their longest line.
const P2_CSS = `
  .beat-label {
    justify-content: center !important;
    margin-top: var(--x-space-2) !important;
    font-size: var(--x-t6) !important;
    line-height: var(--x-l6) !important;
  }
  .beat-label .beat-index { display: none; }
  .beat-label::before, .beat-label::after { display: none !important; }
  .beat-label .beat-name { color: var(--x-ink-3); }
`
async function fitBubbles(page) {
  await page.evaluate(() => {
    for (const bubble of document.querySelectorAll('.bubble')) {
      const range = document.createRange()
      range.selectNodeContents(bubble)
      const lines = [...range.getClientRects()]
      if (lines.length < 2) continue
      const tops = new Map()
      for (const r of lines) {
        const key = Math.round(r.top)
        const line = tops.get(key) ?? { left: r.left, right: r.right }
        line.left = Math.min(line.left, r.left)
        line.right = Math.max(line.right, r.right)
        tops.set(key, line)
      }
      if (tops.size < 2) continue
      const widest = Math.max(...[...tops.values()].map((l) => l.right - l.left))
      const style = getComputedStyle(bubble)
      const pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      bubble.style.width = `${Math.ceil(widest + pad + 1)}px`
    }
  })
}
async function p2() {
  for (const width of [1440, 390]) {
    for (const beat of [0, 3]) {
      const page = await open(width, 'workspace')
      await page.addStyleTag({ content: P2_CSS })
      if (beat) {
        await page.evaluate((index) => {
          const body = document.querySelector('.window-xborg .window-body')
          const target = document.querySelectorAll('.beat')[index]
          const scroller = width => (window.innerWidth < 900 ? document.querySelector('.window-xborg .window-body') : body)
          const el = scroller()
          el.scrollTop = target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 16
        }, beat)
        await page.waitForTimeout(1200)
      }
      await fitBubbles(page)
      await page.waitForTimeout(150)
      await page.screenshot({ path: join(outDir, `p2-${width}-beat-${beat + 1}.png`) })
      await page.close()
    }
  }
}

// P3. Experiences as an access ladder: one row per experience, grouped by Access Level,
// one Stake more action per locked level, and no placeholder monogram tiles.
const P3_CSS = `
  .experience-grid { display: none !important; }
  .ladder { display: grid; gap: var(--x-space-3); }
  .ladder-group { border-radius: var(--x-radius-card); background: var(--x-card-bg); box-shadow: var(--x-card-edge); padding: var(--x-space-2) 0; }
  .ladder-head { display: flex; align-items: center; justify-content: space-between; gap: var(--x-space-4); padding: var(--x-space-3) var(--x-space-6); }
  .ladder-head h3 { margin: 0; font-size: var(--x-t5); line-height: var(--x-l5); font-weight: 600; color: var(--x-ink-1); }
  .ladder-head p { margin: var(--x-space-1) 0 0; font-size: var(--x-t6); line-height: var(--x-l6); color: var(--x-ink-2); }
  .ladder-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--x-space-4); padding: var(--x-space-3) var(--x-space-6); }
  .ladder-row + .ladder-row, .ladder-head + .ladder-row { box-shadow: inset 0 1px 0 var(--x-hairline); }
  .ladder-row strong { display: block; font-size: var(--x-t5); line-height: var(--x-l5); font-weight: 500; color: var(--x-ink-1); }
  .ladder-row span { display: block; font-size: var(--x-t6); line-height: var(--x-l6); color: var(--x-ink-2); }
  .ladder-group.is-locked .ladder-row strong { color: var(--x-ink-2); }
  @container portal-body (max-width: 560px) {
    .ladder-head { flex-direction: column; align-items: stretch; padding: var(--x-space-3) var(--x-space-4); }
    .ladder-row { padding: var(--x-space-3) var(--x-space-4); }
  }
`
async function p3() {
  for (const width of [1440, 390]) {
    const page = await open(width, 'portal-home')
    await page.addStyleTag({ content: P3_CSS })
    await page.evaluate(() => {
      const grid = document.querySelector('.experience-grid')
      if (!grid) return
      const cards = [...grid.querySelectorAll('.experience-card')].map((card) => ({
        name: card.querySelector('h3')?.textContent ?? '',
        description: card.querySelector('p')?.textContent ?? '',
        level: card.querySelector('.experience-level')?.textContent ?? '',
        unlocked: card.classList.contains('is-unlocked'),
        missing: card.querySelector('.experience-card-body > strong')?.textContent ?? '',
      }))
      const groups = new Map()
      for (const card of cards) {
        if (!groups.has(card.level)) groups.set(card.level, [])
        groups.get(card.level).push(card)
      }
      const ladder = document.createElement('div')
      ladder.className = 'ladder'
      for (const [level, items] of groups) {
        const unlocked = items[0].unlocked
        const group = document.createElement('div')
        group.className = `ladder-group ${unlocked ? 'is-unlocked' : 'is-locked'}`
        group.innerHTML = `
          <div class="ladder-head">
            <div>
              <h3>${level}</h3>
              <p>${unlocked ? '<span class="status-badge is-available">Unlocked</span>' : items[0].missing}</p>
            </div>
            ${unlocked ? '' : '<button type="button" class="btn btn-secondary">Stake More</button>'}
          </div>
          ${items
            .map(
              (item) => `<div class="ladder-row"><div><strong>${item.name}</strong><span>${item.description}</span></div>${
                item.unlocked ? `<button type="button" class="btn btn-quiet btn-sm">View</button>` : '<span class="status-badge is-locked">Locked</span>'
              }</div>`,
            )
            .join('')}`
        ladder.appendChild(group)
      }
      grid.after(ladder)
    })
    await scrollPortal(page, '[data-section="experiences"]')
    await page.screenshot({ path: join(outDir, `p3-${width}-experiences.png`) })
    await page.close()
  }
}

// P4. Product windows lead with the product: the status moves into the title bar, the
// capture shows the top of the real site uncut, its date sits under it, and on a phone the
// action stays at the foot of the sheet.
const P4_CSS = `
  .window-product .product-head .product-name { font-size: var(--x-t3); line-height: var(--x-l3); }
  .window-product .product-status { display: none; }
  .window-product .window-accessory .demo-badge.product-state { display: inline-flex; }
  .window-product .product-media { aspect-ratio: auto !important; height: auto !important; }
  .window-product .product-media img { aspect-ratio: 16 / 9; height: auto !important; object-fit: cover; object-position: top; }
  .window-product .capture-note { margin: calc(var(--x-space-2) * -1) 0 0; color: var(--x-ink-3); font-size: var(--x-t7); line-height: var(--x-l7); }
  @media (max-width: 899px) {
    .window-product { top: auto !important; bottom: 0 !important; height: auto !important; max-height: calc(100dvh - var(--x-space-16)) !important; }
    .window-product .window-frame { border-radius: var(--x-radius-window) var(--x-radius-window) 0 0 !important; }
    .window-product .product-body > .btn-wrap { align-self: stretch; padding-bottom: var(--x-space-4); }
    .window-product .product-body > .btn-wrap .btn { width: 100%; justify-content: center; }
  }
`
async function p4() {
  for (const width of [1440, 390]) {
    for (const id of ['propr', 'trigr']) {
      const page = await open(width, id)
      await page.addStyleTag({ content: P4_CSS })
      await page.evaluate(() => {
        const status = document.querySelector('.window-product .product-status')
        const title = document.querySelector('.window-product .window-title')
        if (!status || !title) return
        const label = document.querySelector('.window-product .capture-label')
        const media = document.querySelector('.window-product .product-media')
        if (label && media) {
          const note = document.createElement('p')
          note.className = 'capture-note'
          note.textContent = label.textContent
          label.remove()
          media.after(note)
        }
        const live = status.textContent?.trim() === 'Live'
        const badge = document.createElement('span')
        badge.className = 'window-accessory'
        badge.innerHTML = `<span class="status-badge ${live ? 'is-available' : 'is-pending'}">${status.textContent?.trim()}</span>`
        title.prepend(badge)
      })
      await page.waitForTimeout(150)
      await page.screenshot({ path: join(outDir, `p4-${width}-${id}.png`) })
      await page.close()
    }
  }
}

// P5. One phone language: the mobile dock speaks like the Portal tab bar (product casing,
// no tracked capitals), the Portal title is truly centred, long Portal headings stay within
// two lines, and the reward pool joins the season figures instead of floating alone.
const P5_CSS = `
  @media (max-width: 899px) {
    .dock .dock-label { text-transform: none !important; letter-spacing: 0 !important; font-size: var(--x-t7) !important; }
    /* The header reserves 48px on the left for the review menu even in present mode. */
    .window-portal .window-title { padding-left: var(--x-space-2) !important; }
    .window-portal .window-title > :first-child { justify-self: start; }
    .window-portal .window-title .window-name { justify-self: center; }
    .window-portal .window-title > :last-child { justify-self: end; }
  }
  @container portal-body (max-width: 560px) {
    .portal-page-heading h1 { font-stretch: 100% !important; font-variation-settings: 'wdth' 100 !important; text-wrap: balance; }
    .season-panel > .section-heading-row { flex-direction: row !important; align-items: flex-start !important; }
    .season-panel .season-pool { text-align: right; }
  }
`
async function p5() {
  const names = { PROPR: 'Propr', FANBASE: 'FanBase', TRIGR: 'Trigr', 'XBG PORTAL': 'XBG Portal' }
  for (const id of ['workspace', 'portal-home', 'portal-participate']) {
    const page = await open(390, id)
    await page.addStyleTag({ content: P5_CSS })
    await page.evaluate((map) => {
      for (const label of document.querySelectorAll('.dock .dock-label')) {
        const text = label.textContent?.trim() ?? ''
        if (map[text]) label.textContent = map[text]
      }
    }, names)
    await page.waitForTimeout(150)
    await page.screenshot({ path: join(outDir, `p5-390-${id}.png`) })
    await page.close()
  }
}

const MOCKS = { p1, p2, p3, p4, p5 }
for (const [name, run] of Object.entries(MOCKS)) {
  if (only.length && !only.includes(name)) continue
  await run()
  console.log(`${name} done`)
}
await browser.close()
console.log(`Saved to ${outDir}`)
