export type StakeScreenId =
  | 'stake-entry'
  | 'stake-restricted'
  | 'stake-no-xbg'
  | 'stake-not-verified'
  | 'stake-verify-email'
  | 'stake-verify-sign'
  | 'stake-verify-refused'
  | 'stake-verify-done'
  | 'stake-linked'
  | 'stake-check-unavailable'
  | 'stake-eligible'
  | 'stake-eligible-nft'
  | 'stake-pledge-amount'
  | 'stake-pledge-invalid'
  | 'stake-pledge-confirm'
  | 'stake-pledge-signing'
  | 'stake-pledge-rejected'
  | 'stake-pledge-submitting'
  | 'stake-pledge-done'
  | 'stake-pledge-lost'
  | 'stake-pledge-refused'
  | 'stake-active'
  | 'stake-not-earning'
  | 'stake-all-pledged'
  | 'stake-balance-error'
  | 'stake-upcoming'
  | 'stake-season-closed'
  | 'stake-leaderboard'
  | 'stake-history'
  | 'stake-positions'
  | 'stake-unstake-confirm'
  | 'stake-positions-empty'

export type ScreenId =
  | 'workspace'
  | 'propr'
  | 'fanbase'
  | 'trigr'
  | StakeScreenId
  | 'earn'
  | 'system'
  | 'references'
  | 'notes'

export type ProductId = 'propr' | 'fanbase' | 'trigr'
export type NavigationSource = 'direct' | 'push' | 'history'

export type ScreenGroup = 'Landing' | 'Stake' | 'Stake dialogs' | 'Earn' | 'Documentation'

export const SCREENS: { id: ScreenId; label: string; group: ScreenGroup }[] = [
  { id: 'workspace', label: 'Workspace', group: 'Landing' },
  { id: 'propr', label: 'Propr window', group: 'Landing' },
  { id: 'fanbase', label: 'FanBase window', group: 'Landing' },
  { id: 'trigr', label: 'Trigr window', group: 'Landing' },
  { id: 'stake-entry', label: 'Stake, no wallet', group: 'Stake' },
  { id: 'stake-restricted', label: 'Stake, region restricted', group: 'Stake' },
  { id: 'stake-no-xbg', label: 'Connected, no XBG', group: 'Stake' },
  { id: 'stake-not-verified', label: 'Holds XBG, not verified', group: 'Stake' },
  { id: 'stake-linked', label: 'Email linked, not eligible', group: 'Stake' },
  { id: 'stake-check-unavailable', label: 'Eligibility check unavailable', group: 'Stake' },
  { id: 'stake-eligible', label: 'Eligible, not pledged', group: 'Stake' },
  { id: 'stake-eligible-nft', label: 'Eligible by NFT, no email', group: 'Stake' },
  { id: 'stake-active', label: 'Pledged and earning', group: 'Stake' },
  { id: 'stake-not-earning', label: 'Pledged, not earning', group: 'Stake' },
  { id: 'stake-all-pledged', label: 'All XBG pledged', group: 'Stake' },
  { id: 'stake-balance-error', label: 'Pledged balance unavailable', group: 'Stake' },
  { id: 'stake-upcoming', label: 'Season not open yet', group: 'Stake' },
  { id: 'stake-season-closed', label: 'Season closed', group: 'Stake' },
  { id: 'stake-history', label: 'Completed seasons', group: 'Stake' },
  { id: 'stake-positions', label: 'Staking positions', group: 'Stake' },
  { id: 'stake-positions-empty', label: 'No staking positions', group: 'Stake' },
  { id: 'stake-verify-email', label: 'Verify, email', group: 'Stake dialogs' },
  { id: 'stake-verify-sign', label: 'Verify, sign', group: 'Stake dialogs' },
  { id: 'stake-verify-refused', label: 'Verify, refused', group: 'Stake dialogs' },
  { id: 'stake-verify-done', label: 'Verify, linked', group: 'Stake dialogs' },
  { id: 'stake-pledge-amount', label: 'Pledge, amount', group: 'Stake dialogs' },
  { id: 'stake-pledge-invalid', label: 'Pledge, amount too high', group: 'Stake dialogs' },
  { id: 'stake-pledge-confirm', label: 'Pledge, confirm', group: 'Stake dialogs' },
  { id: 'stake-pledge-signing', label: 'Pledge, waiting for wallet', group: 'Stake dialogs' },
  { id: 'stake-pledge-rejected', label: 'Pledge, signature cancelled', group: 'Stake dialogs' },
  { id: 'stake-pledge-submitting', label: 'Pledge, submitting', group: 'Stake dialogs' },
  { id: 'stake-pledge-done', label: 'Pledge, success', group: 'Stake dialogs' },
  { id: 'stake-pledge-lost', label: 'Pledge, lost contact', group: 'Stake dialogs' },
  { id: 'stake-pledge-refused', label: 'Pledge, refused', group: 'Stake dialogs' },
  { id: 'stake-leaderboard', label: 'Season leaderboard', group: 'Stake dialogs' },
  { id: 'stake-unstake-confirm', label: 'Unstake, confirm in wallet', group: 'Stake dialogs' },
  { id: 'earn', label: 'Earn window', group: 'Earn' },
  { id: 'system', label: 'Design system', group: 'Documentation' },
  { id: 'references', label: 'Mobbin references', group: 'Documentation' },
  { id: 'notes', label: 'Design notes', group: 'Documentation' },
]

export const SCREEN_GROUPS: ScreenGroup[] = ['Landing', 'Stake', 'Stake dialogs', 'Earn', 'Documentation']

export const LANDING_SCREENS: ScreenId[] = ['workspace', 'propr', 'fanbase', 'trigr']

export const STAKE_SCREENS: StakeScreenId[] = SCREENS.filter((s) => s.id.startsWith('stake-')).map(
  (s) => s.id as StakeScreenId,
)

// Review links from the XBG Portal rounds keep working. Each old state opens the
// closest Stake state. Missions, referrals and access levels are gone, so their
// links open the active rewards view.
export const SCREEN_ALIASES: Record<string, ScreenId> = {
  'portal-entry': 'stake-entry',
  'portal-mobile-entry': 'stake-entry',
  'portal-no-xbg': 'stake-no-xbg',
  'portal-unstaked': 'stake-eligible',
  'portal-stake-amount': 'stake-pledge-amount',
  'portal-stake-preview': 'stake-pledge-confirm',
  'portal-stake-pending': 'stake-pledge-signing',
  'portal-stake-done': 'stake-pledge-done',
  'portal-home': 'stake-active',
  'portal-home-quiet': 'stake-active',
  'portal-mobile-home': 'stake-active',
  'portal-near-level': 'stake-active',
  'portal-participate': 'stake-active',
  'portal-participate-empty': 'stake-active',
  'portal-network': 'stake-active',
  'portal-rewards': 'stake-history',
  'portal-season-done': 'stake-season-closed',
  'portal-legacy': 'stake-positions',
  stake: 'stake-entry',
}

export function resolveScreenId(raw: string): ScreenId | null {
  if (SCREENS.some((s) => s.id === raw)) return raw as ScreenId
  return SCREEN_ALIASES[raw] ?? null
}

export function parseHash(hash = window.location.hash): ScreenId {
  const id = hash.replace(/^#/, '')
  if (!id) return 'workspace'
  return resolveScreenId(id) ?? 'workspace'
}

export function hrefFor(id: ScreenId): string {
  return `/#${id}`
}

export function isStakeScreen(id: ScreenId): id is StakeScreenId {
  return (STAKE_SCREENS as ScreenId[]).includes(id)
}

export function isLandingScreen(id: ScreenId): boolean {
  return LANDING_SCREENS.includes(id) || isStakeScreen(id) || id === 'earn'
}
