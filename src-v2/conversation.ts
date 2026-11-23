import { assertPublicCopy } from './copyGuard'

export type BeatKind = 'messages' | 'products' | 'portal'

export type Beat = {
  id: string
  index: string
  label: string
  kind: BeatKind
  messages: string[]
}

export const BEATS: Beat[] = [
  {
    id: 'who',
    index: '01',
    label: 'Who we are',
    kind: 'messages',
    messages: [
      'You are probably here for Propr, FanBase or the XBG token.',
      'XBorg is an AI startup studio.',
      'We help small teams build and grow software companies.',
      'We never raised from VCs.',
      'Around 24,000 people hold XBG instead. We answer to them every day on Discord.',
    ],
  },
  {
    id: 'ship',
    index: '02',
    label: 'What we ship',
    kind: 'products',
    messages: [
      'Every product is a bet on the next internet era.',
      'Some we build in house. Some we incubate and spin off.',
    ],
  },
  {
    id: 'work',
    index: '03',
    label: 'How we work',
    kind: 'messages',
    messages: [
      'AI lets a small team do what once needed a large organisation.',
      'We share tooling, distribution and contributors across products.',
      'We bootstrap by default and raise with intent.',
      'The aim is to reach revenue earlier and keep more control.',
    ],
  },
  {
    id: 'roots',
    index: '04',
    label: 'Our roots',
    kind: 'messages',
    messages: [
      "We were a spin off ourselves, from SwissBorg, one of Europe's leading crypto exchanges.",
      'We made our name building fan apps for Team Liquid, G2 and Cloud9.',
      'FanBase grew into a suite of products. Propr is the newest and fastest mover.',
      'Over $1.6M in revenue from 4,200+ paid traders.',
    ],
  },
  {
    id: 'holders',
    index: '05',
    label: 'For XBG holders',
    kind: 'portal',
    messages: [
      'XBG holders help what we build grow.',
      'Stake XBG, take part in missions and campaigns, and join monthly rewards.',
      'Missions are optional. The monthly distribution is not.',
    ],
  },
]

export const PORTAL_PANEL_LINE = 'Stake XBG. Help XBorg grow. Earn monthly rewards.'

// The holder card opens the Stake app.
export const OPEN_STAKE_LABEL = 'Open Stake'

export function publicCopy(): string[] {
  const out: string[] = []
  for (const beat of BEATS) {
    out.push(assertPublicCopy(beat.label))
    for (const message of beat.messages) out.push(assertPublicCopy(message))
  }
  out.push(assertPublicCopy(PORTAL_PANEL_LINE))
  out.push(assertPublicCopy(OPEN_STAKE_LABEL))
  return out
}
