import { assertPublicCopy } from './copyGuard'
import type { ProductId } from './screens'

export type ProductCopy = {
  id: ProductId
  name: string
  status: 'Live' | 'Early access'
  lead: string
  proof: string | null
  action: string
  href: string
  capture: string
  captureLabel: string
}

export const PRODUCTS: ProductCopy[] = [
  {
    id: 'propr',
    name: 'PROPR',
    status: 'Live',
    lead: 'The crypto prop firm built onchain.',
    proof: 'Over $1.6M in revenue from 4,200+ paid traders.',
    action: 'Visit propr.xyz',
    href: 'https://propr.xyz',
    capture: '/V2/captures/propr.jpg',
    captureLabel: 'Interface capture, 2 September 2026',
  },
  {
    id: 'fanbase',
    name: 'FANBASE',
    status: 'Live',
    lead: 'The social marketing platform for brands and creators.',
    proof: 'Fan apps for Team Liquid, G2 and Cloud9.',
    action: 'Visit fanbase.gg',
    href: 'https://fanbase.gg',
    capture: '/V2/captures/fanbase.jpg',
    captureLabel: 'Interface capture, 2 September 2026',
  },
  {
    id: 'trigr',
    name: 'TRIGR',
    status: 'Early access',
    lead: 'The all in one platform to build, trade and automate strategies.',
    proof: null,
    action: 'Join the Trigr beta',
    href: 'https://beta.trigr.xyz',
    capture: '/V2/captures/trigr.jpg',
    captureLabel: 'Interface capture, 2 September 2026',
  },
]

for (const product of PRODUCTS) {
  assertPublicCopy(product.lead)
  if (product.proof) assertPublicCopy(product.proof)
  assertPublicCopy(product.action)
  assertPublicCopy(product.captureLabel)
}
