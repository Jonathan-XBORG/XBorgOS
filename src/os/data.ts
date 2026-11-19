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
  stake: 'Stake',
  // Shown until the live price loads, or if it can't be reached.
  fallbackPrice: null as number | null,
}

export const LINKS = {
  x: 'https://x.com/XBorgHQ',
  discord: 'https://discord.com/invite/xborg',
}

for (const p of OS_PRODUCTS) [p.name, p.action].forEach(assertPublicCopy)
for (const n of OS_NOTIFICATIONS) [n.title, n.body].forEach(assertPublicCopy)
README_LINES.forEach(assertPublicCopy)

// Clients: esports organisations XBorg has worked with. Logos come from the
// production site (public/teams). Edit `note` to add a line about each project.
export type OsClient = { id: string; name: string; logo: string; note: string }

export const CLIENTS_INTRO = [
  'We made our name building fan apps for Team Liquid, G2 and Cloud9.',
  'FanBase grew into a suite of products.',
]

export const OS_CLIENTS: OsClient[] = [
  { id: 'liquid', name: 'Team Liquid', logo: '/os/clients/team_liquid_logo.svg', note: 'Fan app built with FanBase.' },
  { id: 'g2', name: 'G2 Esports', logo: '/os/clients/g2_logo.png', note: 'Fan app built with FanBase.' },
  { id: 'cloud9', name: 'Cloud9', logo: '/os/clients/cloud9_logo.png', note: 'Fan app built with FanBase.' },
  { id: 'vitality', name: 'Team Vitality', logo: '/os/clients/vitality_logo.png', note: 'Esports organisation.' },
  { id: 'eg', name: 'Evil Geniuses', logo: '/os/clients/eg_logo.png', note: 'Esports organisation.' },
  { id: 'nip', name: 'Ninjas in Pyjamas', logo: '/os/clients/nip_logo.png', note: 'Esports organisation.' },
  { id: 'jdg', name: 'JD Gaming', logo: '/os/clients/jdg_logo.png', note: 'Esports organisation.' },
]

// Desktop wallpapers offered in Preferences (Figma, wallpapers frame).
// `opacity` is how strongly the image shows over black: the blue wave is
// dimmed as in the desktop mockups, the two dark ones show as they are.
export type OsWallpaper = { id: string; name: string; src: string; small: string; thumb: string; opacity: number }

const wallpaper = (id: string, name: string, opacity: number): OsWallpaper => ({
  id,
  name,
  src: `/os/wallpaper-${id}.webp`,
  small: `/os/wallpaper-${id}-1920.webp`,
  thumb: `/os/wallpaper-${id}-thumb.webp`,
  opacity,
})

export const OS_WALLPAPERS: OsWallpaper[] = [
  wallpaper('wave', 'Blue Wave', 0.4),
  wallpaper('glass', 'Glass', 1),
  wallpaper('glow', 'Glow', 1),
]

// The Stake app is the live rewards page. ?embed=1 asks it to drop the site
// navigation and footer (see docs/earn-embed.patch for the xborg-lp change).
export const STAKE_URL = (import.meta.env.VITE_STAKE_URL as string | undefined) ?? 'https://www.xborg.com/earn?embed=1'
export const STAKE_PAGE = 'https://www.xborg.com/earn'

// CoinGecko id of the XBG token, for the widget's live price.
export const XBG_COINGECKO_ID = 'xborg'

// XBG token icon. To host it with the site, save the image as
// public/os/xbg-token.png and point this at '/os/xbg-token.png'.
export const XBG_TOKEN_ICON = 'https://files.swissborg.com/product/wealth-app/assets/ic_crypto_xbg2.png'

CLIENTS_INTRO.forEach(assertPublicCopy)
for (const c of OS_CLIENTS) [c.name, c.note].forEach(assertPublicCopy)
