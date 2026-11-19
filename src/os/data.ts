import { BEATS } from '../conversation'
import { assertPublicCopy } from '../copyGuard'
import { PRODUCTS } from '../products'
import type { ProductId } from '../screens'

// Everything the XBorg OS desktop shows. Copy comes from the site's existing
// sources (products.ts, conversation.ts) so the desktop never says anything new.

export type OsProduct = {
  id: ProductId
  name: string
  dockIcon: string
  icon: string
  shot: string
  lead: string
  proof: string | null
  action: string
  href: string
}

const NAMES: Record<ProductId, string> = { propr: 'Propr', fanbase: 'FanBase', trigr: 'Tradr' }
const ICONS: Record<ProductId, { dock: string; small: string; shot: string }> = {
  propr: { dock: '/os/button-propr.svg', small: '/os/icon-propr-32.svg', shot: '/os/shot-propr.webp' },
  fanbase: { dock: '/os/button-fanbase.svg', small: '/os/icon-fanbase-32.svg', shot: '/os/shot-fanbase.webp' },
  trigr: { dock: '/os/button-tradr.svg', small: '/os/icon-tradr-32.svg', shot: '/os/shot-tradr.webp' },
}
const ACTIONS: Record<ProductId, string> = {
  propr: 'Discover Propr',
  fanbase: 'Discover FanBase',
  trigr: 'Join the Tradr beta',
}

export const OS_PRODUCTS: OsProduct[] = PRODUCTS.map((p) => ({
  id: p.id,
  name: NAMES[p.id],
  dockIcon: ICONS[p.id].dock,
  icon: ICONS[p.id].small,
  shot: ICONS[p.id].shot,
  lead: p.lead,
  proof: p.proof,
  action: ACTIONS[p.id],
  href: p.href,
}))

export const osProduct = (id: ProductId) => OS_PRODUCTS.find((p) => p.id === id)!

export type OsNotification = { id: string; app: ProductId; title: string; body: string }

// Shown one after another in the top left corner when the desktop opens.
export const OS_NOTIFICATIONS: OsNotification[] = [
  { id: 'propr', app: 'propr', title: 'Propr', body: osProduct('propr').proof ?? '' },
  { id: 'fanbase', app: 'fanbase', title: 'FanBase', body: osProduct('fanbase').proof ?? '' },
]

// Readme.txt is the conversation, read top to bottom.
export const README_LINES: string[] = BEATS.flatMap((beat) => beat.messages)

export const XBG_WIDGET = {
  label: 'XBG',
  change: '5.79%',
  period: '24h',
  connect: 'Connect wallet',
}

export const LINKS = {
  x: 'https://x.com/XBorgHQ',
  discord: 'https://discord.com/invite/xborg',
}

for (const p of OS_PRODUCTS) [p.name, p.action].forEach(assertPublicCopy)
for (const n of OS_NOTIFICATIONS) [n.title, n.body].forEach(assertPublicCopy)
README_LINES.forEach(assertPublicCopy)
