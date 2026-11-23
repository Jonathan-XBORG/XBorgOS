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

const NAMES: Record<ProductId, string> = { propr: 'Propr', fanbase: 'FanBase', trigr: 'Trigr' }
const ICONS: Record<ProductId, { dock: string; small: string; shot: string }> = {
  // V2: monochrome tiles from the V2 Figma (node 75:1992).
  propr: { dock: '/V2/os/v2/dock-propr.svg', small: '/V2/os/v2/icon-propr-32.svg', shot: '/V2/os/shot-propr.webp' },
  fanbase: { dock: '/V2/os/v2/dock-fanbase.svg', small: '/V2/os/v2/icon-fanbase-32.svg', shot: '/V2/os/shot-fanbase.webp' },
  trigr: { dock: '/V2/os/v2/dock-trigr.svg', small: '/V2/os/v2/icon-trigr-32.svg', shot: '/V2/os/shot-tradr.webp' },
}
const ACTIONS: Record<ProductId, string> = {
  propr: 'Discover Propr',
  fanbase: 'Discover FanBase',
  trigr: 'Join the Trigr beta',
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
  { id: 'liquid', name: 'Team Liquid', logo: '/V2/os/clients/team_liquid_logo.svg', note: 'Fan app built with FanBase.' },
  { id: 'g2', name: 'G2 Esports', logo: '/V2/os/clients/g2_logo.png', note: 'Fan app built with FanBase.' },
  { id: 'cloud9', name: 'Cloud9', logo: '/V2/os/clients/cloud9_logo.png', note: 'Fan app built with FanBase.' },
  { id: 'vitality', name: 'Team Vitality', logo: '/V2/os/clients/vitality_logo.png', note: 'Esports organisation.' },
  { id: 'eg', name: 'Evil Geniuses', logo: '/V2/os/clients/eg_logo.png', note: 'Esports organisation.' },
  { id: 'nip', name: 'Ninjas in Pyjamas', logo: '/V2/os/clients/nip_logo.png', note: 'Esports organisation.' },
  { id: 'jdg', name: 'JD Gaming', logo: '/V2/os/clients/jdg_logo.png', note: 'Esports organisation.' },
]

// Desktop wallpapers offered in Preferences (Figma, wallpapers frame).
// `opacity` is how strongly the image shows over black: the blue wave is
// dimmed as in the desktop mockups, the two dark ones show as they are.
export type OsWallpaper = { id: string; name: string; src: string; small: string; thumb: string; opacity: number }

// V2: the wallpapers carry the Figma dither (Bayer 16x16, mono, 5 levels,
// contrast 1.54, 2px pixels), rendered once into the images by
// scripts/dither-wallpapers.py.
const wallpaper = (id: string, name: string): OsWallpaper => ({
  id,
  name,
  src: `/V2/os/v2/wallpaper-${id}.webp`,
  small: `/V2/os/v2/wallpaper-${id}-1920.webp`,
  thumb: `/V2/os/v2/wallpaper-${id}-thumb.webp`,
  opacity: 1,
})

export const OS_WALLPAPERS: OsWallpaper[] = [
  // The default: the 3D logo following the pointer, drawn in small squares
  // (LogoWallpaper.tsx).
  { id: 'logo', name: 'XBorg 3D', src: '', small: '', thumb: '/V2/os/v2/wallpaper-logo-thumb.webp', opacity: 1 },
  wallpaper('glass', 'Glass'),
  wallpaper('wave', 'Blue Wave'),
  wallpaper('glow', 'Glow'),
  // Drawn live in a canvas from the XBG price (LiveWallpaper.tsx).
  { id: 'live', name: 'Live XBG', src: '', small: '', thumb: '/V2/os/wallpaper-live-thumb.svg', opacity: 1 },
]

// The Stake app is the live rewards page. ?embed=1 asks it to drop the site
// navigation and footer (see docs/earn-embed.patch for the xborg-lp change).
export const STAKE_URL = (import.meta.env.VITE_STAKE_URL as string | undefined) ?? 'https://www.xborg.com/earn?embed=1'
export const STAKE_PAGE = 'https://www.xborg.com/earn'

// CoinGecko id of the XBG token, for the widget's live price.
export const XBG_COINGECKO_ID = 'xborg'

// XBG token icon. To host it with the site, save the image as
// public/os/xbg-token.png and point this at '/V2/os/xbg-token.png'.
export const XBG_TOKEN_ICON = 'https://files.swissborg.com/product/wealth-app/assets/ic_crypto_xbg2.png'

CLIENTS_INTRO.forEach(assertPublicCopy)
for (const c of OS_CLIENTS) [c.name, c.note].forEach(assertPublicCopy)

// XBG contract addresses, from the buy venues the site already lists
// (src/components/stake/config.ts BUY_VENUES). Check them before launch.
export const XBG_CONTRACTS = [
  { network: 'Arbitrum', address: '0x93fa0b88c0c78e45980fa74cdd87469311b7b3e4' },
  { network: 'Solana', address: 'XBGdqJ9P175hCC1LangCEyXWNeCPHaKWA17tymz2PrY' },
]
export const XBG_CHART_URL = 'https://www.coingecko.com/en/coins/xborg'

// Get Info rows for each app. Figures come from the site's existing copy.
// `launched` and `stack` are left empty until someone fills them in; empty
// rows are not shown.
export type InfoRow = { label: string; value: string }
export type AppInfo = { kind: string; rows: InfoRow[] }

const who = BEATS.find((b) => b.id === 'who')?.messages ?? []

export const APP_INFO: Record<string, AppInfo> = {
  propr: {
    kind: 'Application',
    rows: [
      { label: 'What', value: osProduct('propr').lead },
      { label: 'Revenue', value: 'Over $1.6M' },
      { label: 'Traders', value: '4,200+ paid traders' },
      { label: 'Launched', value: '' },
      { label: 'Stack', value: '' },
    ],
  },
  fanbase: {
    kind: 'Application',
    rows: [
      { label: 'What', value: osProduct('fanbase').lead },
      { label: 'Clients', value: 'Fan apps for Team Liquid, G2 and Cloud9' },
      { label: 'Launched', value: '' },
      { label: 'Stack', value: '' },
    ],
  },
  trigr: {
    kind: 'Application',
    rows: [
      { label: 'What', value: osProduct('trigr').lead },
      { label: 'Status', value: 'Beta' },
      { label: 'Launched', value: '' },
      { label: 'Stack', value: '' },
    ],
  },
  stake: {
    kind: 'Application',
    rows: [
      { label: 'What', value: 'Pledge XBG and earn seasonal rewards' },
      { label: 'Holders', value: 'Around 24,000' },
      { label: 'Runs on', value: 'xborg.com/earn' },
    ],
  },
  chat: {
    kind: 'Application',
    rows: [{ label: 'What', value: 'A conversation with the XBorg team' }],
  },
  readme: {
    kind: 'Plain text document',
    rows: [
      { label: 'Size', value: `${new TextEncoder().encode(README_LINES.join('\n')).length.toLocaleString('en-GB')} bytes` },
      { label: 'Lines', value: String(README_LINES.length) },
    ],
  },
  docs: {
    kind: 'Folder',
    rows: [{ label: 'Contents', value: '7 client logos' }],
  },
  secret: {
    kind: 'Hidden file',
    rows: [{ label: 'Size', value: '' }],
  },
}

// About this OS. Figures from the site's existing copy (conversation.ts).
export const OS_STATS: InfoRow[] = [
  { label: 'XBG holders', value: who[4]?.startsWith('Around 24,000') ? 'Around 24,000' : '24,000' },
  { label: 'Paid traders', value: '4,200+ on Propr' },
  { label: 'Revenue', value: 'Over $1.6M on Propr' },
]

export const SECRET_TEXT = '↑ ↑ ↓ ↓ ← → ← → B A'
