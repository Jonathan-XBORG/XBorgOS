import { ASK_ITEMS, type AskAction, type AskItem } from '../ask'
import { BEATS } from '../conversation'
import { assertPublicCopy } from '../copyGuard'
import { LINKS, OS_PRODUCTS } from './data'

// The Messages window: a small team chat that opens with the desktop. The
// thread with Gauthier plays out like a chatbot and ends on a question that
// points the visitor to the right product. Edit the copy here.

export type ChatAction = AskAction
export type ChatMessage = { from: 'them' | 'me'; text: string; action?: ChatAction }
export type ChatChoice = { id: string; label: string; reply: ChatMessage[] }

export type ChatContact = {
  id: string
  name: string
  role: string
  avatar: string
  // Round photo, or an app icon shown on a tile.
  avatarKind: 'photo' | 'icon'
  online: boolean
  // Played in order, with a typing indicator before each one.
  script: ChatMessage[]
  choices?: ChatChoice[]
}

const beat = (id: string) => BEATS.find((b) => b.id === id)?.messages ?? []
const product = (id: string) => OS_PRODUCTS.find((p) => p.id === id)!
const ask = (id: string) => ASK_ITEMS.find((i) => i.id === id) as Extract<AskItem, { kind: 'question' }>

const GAUTHIER_CHOICES: ChatChoice[] = [
  {
    id: 'trade',
    label: 'I want to trade with Propr',
    reply: [
      { from: 'them', text: `Nice. ${product('propr').lead}` },
      { from: 'them', text: product('propr').proof ?? '', action: { label: 'Open Propr', app: 'propr' } },
    ],
  },
  {
    id: 'brand',
    label: 'I run a brand or I am a creator',
    reply: [
      { from: 'them', text: `Then FanBase is for you. ${product('fanbase').lead}` },
      { from: 'them', text: product('fanbase').proof ?? '', action: { label: 'Open FanBase', app: 'fanbase' } },
    ],
  },
  {
    id: 'xbg',
    label: 'I hold XBG and want rewards',
    reply: [
      ...ask('rewards').answer.map((text) => ({ from: 'them' as const, text })),
      { from: 'them', text: 'You can pledge in a few clicks.', action: { label: 'Open Stake', app: 'stake' } },
    ],
  },
  {
    id: 'build',
    label: 'I want to build with XBorg',
    reply: [
      { from: 'them', text: beat('who')[2] },
      { from: 'them', text: beat('work')[1] },
      { from: 'them', text: 'Come say hi on Discord and tell us what you are working on.', action: { label: 'Join the Discord', href: LINKS.discord } },
    ],
  },
]

export const CHAT_CONTACTS: ChatContact[] = [
  {
    id: 'gauthier',
    name: 'Gauthier',
    role: 'XBorg team',
    avatar: '/V2/os/team/gauthier.webp',
    avatarKind: 'photo',
    online: true,
    script: [
      { from: 'them', text: 'Hello there 👋' },
      { from: 'them', text: 'I am Gauthier, from the XBorg team.' },
      { from: 'them', text: `${beat('who')[1]} ${beat('who')[2]}` },
      { from: 'them', text: 'So, what brings you here today?' },
    ],
    choices: GAUTHIER_CHOICES,
  },
]

// Free text typed in the composer: pick the closest known answer.
export function answerFor(text: string): ChatMessage[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
  let best: Extract<AskItem, { kind: 'question' }> | null = null
  let bestScore = 0
  for (const item of ASK_ITEMS) {
    if (item.kind !== 'question') continue
    const hay = `${item.title} ${item.keywords}`.toLowerCase().split(/\s+/)
    const score = words.filter((w) => w.length > 2 && hay.some((h) => h.startsWith(w))).length
    if (score > bestScore) {
      best = item
      bestScore = score
    }
  }
  if (!best) {
    return [
      { from: 'them', text: 'Good question. The quickest way to get a real answer is our Discord.', action: { label: 'Join the Discord', href: LINKS.discord } },
    ]
  }
  return best.answer.map((line, i, all) => ({ from: 'them', text: line, action: i === all.length - 1 ? best!.action : undefined }))
}

for (const c of CHAT_CONTACTS) {
  ;[c.name, c.role].forEach(assertPublicCopy)
  c.script.forEach((m) => assertPublicCopy(m.text))
  c.choices?.forEach((ch) => {
    assertPublicCopy(ch.label)
    ch.reply.forEach((m) => assertPublicCopy(m.text))
  })
}
