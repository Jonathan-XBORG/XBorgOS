import { BEATS } from './conversation'
import { assertPublicCopy } from './copyGuard'
import { PRODUCTS } from './products'
import { SEASON, formatXbg } from './components/stake/config'
import type { DockAppId } from './components/Dock'

// What the menu bar's Ask field knows. Every answer is copy the site already
// shows somewhere else, so the prototype never says anything new. A production
// build would put a real agent behind the same field.

export type AskAction = { label: string; app: DockAppId } | { label: string; href: string }

export type AskItem =
  | { kind: 'app'; id: string; app: DockAppId; title: string; hint: string; keywords: string }
  | { kind: 'question'; id: string; title: string; answer: string[]; action?: AskAction; keywords: string }

const beat = (id: string) => BEATS.find((b) => b.id === id)?.messages ?? []
const product = (id: string) => PRODUCTS.find((p) => p.id === id)!

export const ASK_PLACEHOLDER = 'Ask about XBorg, Propr or XBG'

export const ASK_ITEMS: AskItem[] = [
  {
    kind: 'question',
    id: 'what',
    title: 'What is XBorg?',
    answer: [beat('who')[1], beat('who')[2]],
    keywords: 'xborg about studio company who what',
  },
  {
    kind: 'question',
    id: 'rewards',
    title: 'How do XBG rewards work?',
    answer: [
      `Every season we share ${formatXbg(SEASON.pool)} with wallets that pledge XBG.`,
      'Your XBG stays in your wallet the whole time.',
    ],
    action: { label: 'Open Stake', app: 'stake' },
    keywords: 'xbg token stake staking pledge rewards earn season pool',
  },
  {
    kind: 'question',
    id: 'backers',
    title: 'Who backs XBorg?',
    answer: [beat('who')[3], beat('who')[4]],
    action: { label: 'Join the Discord', href: 'https://discord.com/invite/xborg' },
    keywords: 'vc funding investors raise holders community discord backers',
  },
  {
    kind: 'question',
    id: 'propr',
    title: 'What is Propr?',
    answer: [product('propr').lead, product('propr').proof ?? ''].filter(Boolean),
    action: { label: 'Open Propr', app: 'propr' },
    keywords: 'propr prop firm trading traders crypto',
  },
  {
    kind: 'question',
    id: 'fanbase',
    title: 'What is FanBase?',
    answer: [product('fanbase').lead, product('fanbase').proof ?? ''].filter(Boolean),
    action: { label: 'Open FanBase', app: 'fanbase' },
    keywords: 'fanbase fans brands creators marketing esports',
  },
  {
    kind: 'question',
    id: 'trigr',
    title: 'What is Tradr?',
    answer: [product('trigr').lead],
    action: { label: 'Open Tradr', app: 'trigr' },
    keywords: 'tradr trigr strategies automate trade build beta',
  },
  {
    kind: 'question',
    id: 'roots',
    title: 'Where did XBorg start?',
    answer: [beat('roots')[0], beat('roots')[1]],
    keywords: 'history roots swissborg origin start team liquid g2 cloud9',
  },
  { kind: 'app', id: 'app-stake', app: 'stake', title: 'Stake', hint: 'Pledge XBG for rewards', keywords: 'stake pledge xbg wallet rewards' },
  { kind: 'app', id: 'app-propr', app: 'propr', title: 'Propr', hint: 'App', keywords: 'propr' },
  { kind: 'app', id: 'app-fanbase', app: 'fanbase', title: 'FanBase', hint: 'App', keywords: 'fanbase' },
  { kind: 'app', id: 'app-trigr', app: 'trigr', title: 'Tradr', hint: 'App', keywords: 'tradr trigr' },
  { kind: 'app', id: 'app-earn', app: 'earn', title: 'Earn', hint: 'App', keywords: 'earn' },
]

for (const item of ASK_ITEMS) {
  assertPublicCopy(item.title)
  if (item.kind === 'question') item.answer.forEach(assertPublicCopy)
  else assertPublicCopy(item.hint)
}
assertPublicCopy(ASK_PLACEHOLDER)

// Every word typed must appear in the title or the keywords. Apps rank first
// when a name is typed exactly; otherwise questions lead.
export function searchAsk(query: string): AskItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return ASK_ITEMS
  const hits = ASK_ITEMS.filter((item) => {
    const hay = `${item.title} ${item.keywords}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
  const exact = hits.filter((i) => i.kind === 'app' && i.title.toLowerCase() === query.trim().toLowerCase())
  return [...exact, ...hits.filter((i) => !exact.includes(i))]
}
