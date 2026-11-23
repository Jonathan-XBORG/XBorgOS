// Stake mock data. Season figures follow the live xborg.com/earn page on
// 17 October 2026 (Season 20, 1,000,000 XBG pool, 56.0M XBG pledged, 291
// wallets on the leaderboard). The holder wallet and its history are invented
// and only need to be consistent with each other.

export type EligibilitySource = 'propr' | 'fanbase' | 'prometheus' | 'community'

export const SOURCE_LABELS: Record<EligibilitySource, string> = {
  propr: 'PROPR Trader',
  fanbase: 'FanBase Pro',
  prometheus: 'Prometheus NFT Holder',
  community: 'Community App',
}

export const SEASON = {
  number: 20,
  pool: 1_000_000,
  opened: '1 October, 12:30 UTC',
  closes: '31 October, 12:30 UTC',
  daysLeft: 14,
  length: 30,
  totalPledged: 56_032_479,
  participants: 291,
  // The live page labels the old staking contract's staker count this way.
  pledgersAllTime: 398,
  seasonAccruedPoints: 3_695_532_233,
  seasonDailyPoints: 248_270_653,
  remainingSnapshots: 14,
} as const

export const NEXT_SEASON = {
  number: 21,
  opens: '1 November, 12:30 UTC',
  opensShort: '1 Nov',
} as const

export const DEMO_WALLET = {
  address: '0x8f2a…c41d',
  // Full form, used only inside the demo signature message.
  full: '0x8f2a61d07be35c9e4a01f2b6d8c03e5a7b19c41d',
  balance: 48_750,
  email: 'holder@example.com',
} as const

export type Requirement = {
  id: EligibilitySource
  title: string
  body: string
  action: string
  href: string
  // PROPR and FanBase are checked through the linked email, the others by wallet.
  viaEmail: boolean
}

export const REQUIREMENTS: readonly Requirement[] = [
  {
    id: 'propr',
    title: 'PROPR challenge',
    body: 'Purchase at least one PROPR challenge this season to activate XBG rewards.',
    action: 'Purchase Challenge',
    href: 'https://propr.xyz',
    viaEmail: true,
  },
  {
    id: 'fanbase',
    title: 'FanBase Pro',
    body: 'Keep an active FanBase Pro plan this season to activate XBG rewards.',
    action: 'Get FanBase Pro',
    href: 'https://fanbase.gg',
    viaEmail: true,
  },
  {
    id: 'prometheus',
    title: 'Prometheus NFT',
    body: 'Hold at least one Prometheus NFT in this wallet to activate XBG rewards.',
    action: 'View Collection',
    href: 'https://opensea.io/collection/xborg-prometheus',
    viaEmail: false,
  },
  {
    id: 'community',
    title: 'Community App',
    body: 'Bind this wallet in the Community App and take part until you appear on its leaderboard.',
    action: 'Open Community App',
    href: 'https://community.xborg.com',
    viaEmail: false,
  },
] as const

export type BoostKey =
  | 'streak'
  | 'pledge_increase'
  | 'governance'
  | 'prometheus'
  | 'chestplate'
  | 'in_app_store_boost'
  | 'premium_boost'

export type Boost = {
  key: BoostKey
  label: string
  range: string
  detail: string
  action: string
  // Pledge actions open the pledge flow. The others point at the live venues.
  kind: 'pledge' | 'link'
  href?: string
}

export const BOOSTS: readonly Boost[] = [
  { key: 'streak', label: 'Season Streak', range: '5% to 20%', detail: '5% for each consecutive season, up to 20%', action: 'Pledge', kind: 'pledge' },
  { key: 'pledge_increase', label: 'Pledge Increase Versus Last Season', range: '5% to 50%', detail: 'More XBG pledged than last season', action: 'Pledge more', kind: 'pledge' },
  { key: 'governance', label: 'Governance Voter', range: '10% to 25%', detail: 'Snapshot votes for XBorg', action: 'Vote', kind: 'link', href: 'https://snapshot.box/#/s:xborg.eth' },
  { key: 'prometheus', label: 'Prometheus NFT', range: '20% per NFT', detail: 'Prometheus collection', action: 'Buy', kind: 'link', href: 'https://opensea.io/collection/xborg-prometheus' },
  { key: 'chestplate', label: 'Chestplate NFT', range: '2.5% per NFT', detail: 'Chestplate collection on Polygon', action: 'Buy', kind: 'link', href: 'https://magiceden.io' },
  { key: 'in_app_store_boost', label: 'Community App Booster', range: '20%', detail: 'Available in the Community App store', action: 'Buy', kind: 'link', href: 'https://community.xborg.com' },
  { key: 'premium_boost', label: 'Premium Boost', range: '5%', detail: 'Community App premium access', action: 'View', kind: 'link', href: 'https://community.xborg.com' },
] as const

export type ActiveBoost = { key: BoostKey; value: number; count?: number }

export function boostCountLine(boost: ActiveBoost): string | null {
  if (boost.count === undefined) return null
  const n = boost.count
  if (boost.key === 'streak') return `${n} ${n === 1 ? 'season' : 'seasons'} in a row`
  if (boost.key === 'governance') return `${n} ${n === 1 ? 'vote' : 'votes'}`
  if (boost.key === 'prometheus' || boost.key === 'chestplate') return `${n} ${n === 1 ? 'NFT' : 'NFTs'}`
  return null
}

export function multiplierFor(boosts: readonly ActiveBoost[]): number {
  return Math.round((1 + boosts.reduce((sum, b) => sum + b.value, 0)) * 100) / 100
}

export type Position = {
  id: number
  amount: number
  term: '3 months' | '6 months' | '12 months'
  multiplier: string
  until: string
  daysLeft: number
  withdrawn: boolean
}

// The closed PROPR staking campaign, 26 February to 24 August 2026.
export const POSITIONS: readonly Position[] = [
  { id: 1, amount: 180_000, term: '12 months', multiplier: '4.0x', until: '26 Feb 2027', daysLeft: 132, withdrawn: false },
  { id: 2, amount: 70_000, term: '6 months', multiplier: '1.5x', until: '26 Aug 2026', daysLeft: 0, withdrawn: false },
  { id: 3, amount: 25_000, term: '3 months', multiplier: '1.0x', until: '26 May 2026', daysLeft: 0, withdrawn: true },
] as const

// 130M PROPR shared by effective stake: 850,000 of about 600M effective XBG.
export const PROPR_ALLOCATION = (850_000 / 600_000_000) * 130_000_000

export const ALLOCATION_SUMMARY = {
  totalPropr: 130_000_000,
  wallets: 429,
  positions: 909,
  vaults: 4,
  walletXbg: 272_083_084,
} as const

export type HistoryRow = {
  season: number
  pledged: number | null
  reward: number | null
  pool: number
  status: 'Distributed' | 'Processing' | 'Ineligible'
}

export const HISTORY: readonly HistoryRow[] = [
  { season: 19, pledged: 250_000, reward: 3_618, pool: 1_000_000, status: 'Distributed' },
  { season: 18, pledged: 200_000, reward: 1_126, pool: 1_000_000, status: 'Distributed' },
  { season: 17, pledged: 150_000, reward: 0, pool: 1_000_000, status: 'Ineligible' },
  { season: 16, pledged: 150_000, reward: 1_904, pool: 1_000_000, status: 'Distributed' },
  { season: 15, pledged: 100_000, reward: 1_512, pool: 1_000_000, status: 'Distributed' },
  { season: 14, pledged: 100_000, reward: 1_688, pool: 1_000_000, status: 'Distributed' },
] as const

export const BUY_VENUES = [
  { name: 'SwissBorg', network: 'SwissBorg app', href: 'https://swissborg.com/crypto-market/coins/xborg' },
  { name: 'Jupiter', network: 'Solana', href: 'https://jup.ag/?buy=XBGdqJ9P175hCC1LangCEyXWNeCPHaKWA17tymz2PrY' },
  { name: 'Uniswap', network: 'Arbitrum', href: 'https://app.uniswap.org/swap?chain=arbitrum&outputCurrency=0x93fa0b88c0c78e45980fa74cdd87469311b7b3e4' },
] as const

export const HOW_IT_WORKS = [
  { title: 'Hold XBG', body: 'It stays in your own wallet the whole time.' },
  { title: 'Pledge XBG', body: 'Choose the amount you commit to keep in your wallet. Staked XBG counts too.' },
  {
    title: 'Stay eligible',
    body: 'Purchase a PROPR challenge, keep FanBase Pro active, hold a Prometheus NFT, or appear on the Community App leaderboard.',
  },
  { title: 'Receive your share', body: 'Paid in XBG at season end, sized by holding and multiplier.' },
] as const

const number = new Intl.NumberFormat('en-GB')

export function formatNumber(value: number): string {
  return number.format(Math.round(value))
}

export function formatXbg(value: number): string {
  return `${formatNumber(value)} XBG`
}

export function formatCompact(value: number): string {
  return `${(value / 1_000_000).toFixed(1)}M`
}

export function formatMultiplier(value: number): string {
  return `×${Number(value.toFixed(2))}`
}

// Points accrue once a day: pledged XBG times the multiplier. A pledge made now
// only earns for the snapshots left in the season. This follows the live
// estimate endpoint and its estimateWithAdded helper.
export function estimateReward({
  accrued,
  daily,
  adding = 0,
  multiplier,
}: {
  accrued: number
  daily: number
  adding?: number
  multiplier: number
}): number {
  const added = Math.max(0, adding) * multiplier
  const remaining = SEASON.remainingSnapshots
  const numerator = accrued + remaining * (daily + added)
  const denominator = SEASON.seasonAccruedPoints + remaining * (SEASON.seasonDailyPoints + added)
  if (numerator <= 0 || denominator <= 0) return 0
  return (numerator / denominator) * SEASON.pool
}

// The visitor example on the live page: one day's share for 100,000 XBG at ×1,
// applied to the whole pool. Kept as live shows it (403 XBG).
export function visitorExample(): number {
  return (100_000 / (SEASON.seasonDailyPoints + 100_000)) * SEASON.pool
}

export type LeaderboardRow = {
  rank: number
  wallet: string
  pledged: number
  boost: number
  points: number
  you?: boolean
}

// Deterministic filler so the board reads the same on every load.
function seeded(index: number): number {
  const x = Math.sin(index * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function hex(index: number): string {
  return Math.floor(seeded(index + 7) * 0xffff)
    .toString(16)
    .padStart(4, '0')
}

const TOP_ROWS = [
  { wallet: '0x...0e65', pledged: 3_793_339, boost: 14.15, points: 856_156_685 },
  { wallet: '0x...5617', pledged: 4_342_892, boost: 6.3, points: 300_962_423 },
  { wallet: '0x...5c3e', pledged: 1_989_927, boost: 5.28, points: 177_650_733 },
]

export function buildLeaderboard(you: { pledged: number; boost: number; points: number } | null): LeaderboardRow[] {
  const rows: Omit<LeaderboardRow, 'rank'>[] = [...TOP_ROWS]
  const others = SEASON.participants - TOP_ROWS.length - (you ? 1 : 0)
  for (let i = 0; i < others; i += 1) {
    // Pledges fall away along a long tail, down to single digit wallets.
    const pledged = Math.max(5, Math.round(1_600_000 * Math.pow(0.968, i) * (0.7 + seeded(i) * 0.6)))
    const boost = Math.round((1 + seeded(i + 300) * 0.8) * 100) / 100
    const days = 16 - Math.floor(seeded(i + 600) * 6)
    rows.push({ wallet: `0x...${hex(i)}`, pledged, boost, points: pledged * boost * days })
  }
  if (you) rows.push({ wallet: DEMO_WALLET.address, ...you, you: true })
  return rows
    .sort((a, b) => b.points - a.points)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

export function allocationRows(): { rank: number; wallet: string; positions: number; staked: number; effective: number; propr: number; you?: boolean }[] {
  const rows = [
    { wallet: 'SwissBorg Vault', positions: 1, staked: 23_046_568, effective: 92_186_271 },
    { wallet: DEMO_WALLET.address, positions: 3, staked: 275_000, effective: 850_000, you: true },
  ]
  for (let i = 0; i < 48; i += 1) {
    const staked = Math.round(9_000_000 * Math.pow(0.9, i) * (0.75 + seeded(i + 900) * 0.5))
    const factor = [1, 1.5, 4][Math.floor(seeded(i + 1200) * 3)]
    rows.push({ wallet: `0x...${hex(i + 2000)}`, positions: 1 + Math.floor(seeded(i + 1500) * 4), staked, effective: staked * factor })
  }
  const totalEffective = 600_000_000
  return rows
    .sort((a, b) => b.effective - a.effective)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      propr: (row.effective / totalEffective) * ALLOCATION_SUMMARY.totalPropr,
    }))
}
