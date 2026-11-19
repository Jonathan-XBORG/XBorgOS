import type { StakeScreenId } from '../../screens'
import {
  DEMO_WALLET,
  POSITIONS,
  SEASON,
  buildLeaderboard,
  estimateReward,
  formatXbg,
  multiplierFor,
  type ActiveBoost,
  type EligibilitySource,
  type Position,
} from './config'

export type StakeView = 'rewards' | 'positions' | 'history'
export type SeasonState = 'open' | 'upcoming' | 'closed'
export type EligibilityStatus = 'unlinked' | 'linked' | 'eligible' | 'unavailable'
export type SignPhase = 'idle' | 'signing' | 'rejected' | 'submitting'
export type PledgeResult = 'done' | 'lost' | 'refused'
export type UnstakePhase = 'idle' | 'wallet' | 'confirming' | 'rejected' | 'done'

export type StakeModal =
  | {
      kind: 'pledge'
      step: 'amount' | 'confirm' | 'result'
      amountText: string
      error: boolean
      phase: SignPhase
      result: PledgeResult | null
    }
  | {
      kind: 'verify'
      step: 'email' | 'sign' | 'done'
      email: string
      error: boolean
      phase: 'idle' | 'signing' | 'rejected' | 'refused'
    }
  | { kind: 'leaderboard'; shown: number }
  | { kind: 'allocations'; shown: number }
  | { kind: 'buy' }
  | { kind: 'unstake'; positionId: number }
  | null

export type StakeState = {
  view: StakeView
  season: SeasonState
  wallet: number
  positions: Position[]
  pledged: number
  // Points only move at the daily snapshot, so rank and accrued points keep
  // the pledge as it stood at the last snapshot.
  snapshotPledged: number
  accrued: number
  pledgeReadFailed: boolean
  eligibility: EligibilityStatus
  source: EligibilitySource | null
  email: string | null
  checking: EligibilitySource | null
  boosts: ActiveBoost[]
  streak: number
  modal: StakeModal
  unstake: Record<number, UnstakePhase>
  historyShown: number
  boostsOpen: boolean
  toast: string | null
  toastTone: 'success' | 'error'
}

export type StakeAction =
  | { type: 'nav'; view: StakeView }
  | { type: 'reset'; screen: StakeScreenId }
  | { type: 'pledge.open' }
  | { type: 'pledge.amount'; text: string }
  | { type: 'pledge.max' }
  | { type: 'pledge.next' }
  | { type: 'pledge.back' }
  | { type: 'pledge.sign' }
  | { type: 'pledge.reject' }
  | { type: 'pledge.approve' }
  | { type: 'pledge.submitted' }
  | { type: 'pledge.refresh' }
  | { type: 'verify.open' }
  | { type: 'verify.email'; text: string }
  | { type: 'verify.next' }
  | { type: 'verify.sign' }
  | { type: 'verify.reject' }
  | { type: 'verify.approve' }
  | { type: 'eligibility.recheck'; source: EligibilitySource }
  | { type: 'eligibility.checked' }
  | { type: 'buy.open' }
  | { type: 'buy.simulate' }
  | { type: 'leaderboard.open' }
  | { type: 'leaderboard.more' }
  | { type: 'allocations.open' }
  | { type: 'allocations.more' }
  | { type: 'history.more' }
  | { type: 'boosts.toggle' }
  | { type: 'unstake.start'; id: number }
  | { type: 'unstake.reject' }
  | { type: 'unstake.approve' }
  | { type: 'unstake.confirmed'; id: number }
  | { type: 'modal.close' }
  | { type: 'toast.clear' }

const HOLDER_BOOSTS: ActiveBoost[] = [
  { key: 'streak', value: 0.15, count: 3 },
  { key: 'governance', value: 0.1, count: 2 },
]

// Snapshots taken so far in Season 20.
const ELAPSED_SNAPSHOTS = SEASON.length - SEASON.remainingSnapshots

function base(): StakeState {
  return {
    view: 'rewards',
    season: 'open',
    wallet: DEMO_WALLET.balance,
    positions: POSITIONS.map((p) => ({ ...p })),
    pledged: 0,
    snapshotPledged: 0,
    accrued: 0,
    pledgeReadFailed: false,
    eligibility: 'unlinked',
    source: null,
    email: null,
    checking: null,
    boosts: HOLDER_BOOSTS.map((b) => ({ ...b })),
    streak: 3,
    modal: null,
    unstake: {},
    historyShown: 4,
    boostsOpen: false,
    toast: null,
    toastTone: 'success',
  }
}

function eligible(state: StakeState, source: EligibilitySource = 'propr'): StakeState {
  return { ...state, eligibility: 'eligible', source, email: source === 'propr' || source === 'fanbase' ? DEMO_WALLET.email : state.email }
}

function pledgedAtSnapshot(state: StakeState, amount: number): StakeState {
  const multiplier = multiplierFor(state.boosts)
  return { ...state, pledged: amount, snapshotPledged: amount, accrued: amount * multiplier * ELAPSED_SNAPSHOTS }
}

function pledgeModal(step: 'amount' | 'confirm' | 'result', extra: Partial<Extract<StakeModal, { kind: 'pledge' }>> = {}): StakeModal {
  return { kind: 'pledge', step, amountText: '25000', error: false, phase: 'idle', result: null, ...extra }
}

function verifyModal(step: 'email' | 'sign' | 'done', extra: Partial<Extract<StakeModal, { kind: 'verify' }>> = {}): StakeModal {
  return { kind: 'verify', step, email: DEMO_WALLET.email, error: false, phase: 'idle', ...extra }
}

export function createStakeState(screen: StakeScreenId): StakeState {
  const holder = base()
  const active = pledgedAtSnapshot(eligible(holder), 250_000)
  const noPositions = { ...holder, wallet: 120_000, positions: [], boosts: [{ key: 'prometheus' as const, value: 0.2, count: 1 }], streak: 0 }

  switch (screen) {
    case 'stake-no-xbg':
      return { ...holder, wallet: 0, positions: [], boosts: [], streak: 0 }
    case 'stake-not-verified':
    case 'stake-entry':
    case 'stake-restricted':
      return holder
    case 'stake-linked':
      return { ...holder, eligibility: 'linked', email: DEMO_WALLET.email }
    case 'stake-check-unavailable':
      return { ...holder, eligibility: 'unavailable' }
    case 'stake-eligible':
      return eligible(holder)
    case 'stake-eligible-nft':
      return eligible(noPositions, 'prometheus')
    case 'stake-positions-empty':
      return { ...eligible(noPositions, 'prometheus'), view: 'positions' }
    case 'stake-active':
      return active
    case 'stake-not-earning':
      return pledgedAtSnapshot({ ...holder, eligibility: 'linked', email: DEMO_WALLET.email }, 250_000)
    case 'stake-all-pledged':
      return pledgedAtSnapshot(eligible(holder), holder.wallet + 250_000)
    case 'stake-balance-error':
      return { ...eligible(holder), pledgeReadFailed: true }
    case 'stake-upcoming':
      return { ...holder, season: 'upcoming', eligibility: 'linked', email: DEMO_WALLET.email }
    case 'stake-season-closed':
      return { ...active, season: 'closed' }
    case 'stake-history':
      return { ...active, view: 'history' }
    case 'stake-positions':
      return { ...active, view: 'positions' }
    case 'stake-leaderboard':
      return { ...active, modal: { kind: 'leaderboard', shown: 20 } }
    case 'stake-unstake-confirm':
      return { ...active, view: 'positions', unstake: { 2: 'wallet' }, modal: { kind: 'unstake', positionId: 2 } }
    case 'stake-verify-email':
      return { ...holder, modal: verifyModal('email', { email: '' }) }
    case 'stake-verify-sign':
      return { ...holder, modal: verifyModal('sign', { phase: 'signing' }) }
    case 'stake-verify-refused':
      return { ...holder, modal: verifyModal('sign', { phase: 'refused' }) }
    case 'stake-verify-done':
      return { ...holder, eligibility: 'linked', email: DEMO_WALLET.email, modal: verifyModal('done') }
    case 'stake-pledge-amount':
      return { ...eligible(holder), modal: pledgeModal('amount') }
    case 'stake-pledge-invalid':
      return { ...eligible(holder), modal: pledgeModal('amount', { amountText: '400000', error: true }) }
    case 'stake-pledge-confirm':
      return { ...eligible(holder), modal: pledgeModal('confirm') }
    case 'stake-pledge-signing':
      return { ...eligible(holder), modal: pledgeModal('confirm', { phase: 'signing' }) }
    case 'stake-pledge-rejected':
      return { ...eligible(holder), modal: pledgeModal('confirm', { phase: 'rejected' }) }
    case 'stake-pledge-submitting':
      return { ...eligible(holder), modal: pledgeModal('confirm', { phase: 'submitting' }) }
    case 'stake-pledge-done':
      return { ...eligible(holder), pledged: 25_000, modal: pledgeModal('result', { result: 'done' }) }
    case 'stake-pledge-lost':
      return { ...eligible(holder), modal: pledgeModal('result', { result: 'lost' }) }
    case 'stake-pledge-refused':
      return { ...eligible(holder), modal: pledgeModal('result', { result: 'refused' }) }
    default:
      return holder
  }
}

export function stakedTotal(state: StakeState): number {
  return state.positions.filter((p) => !p.withdrawn).reduce((sum, p) => sum + p.amount, 0)
}

export function availableToPledge(state: StakeState): number {
  return Math.max(0, state.wallet + stakedTotal(state) - state.pledged)
}

export function maxPledge(state: StakeState): number {
  return Math.floor(availableToPledge(state) * 100) / 100
}

export function parseAmount(text: string): number {
  const clean = text.replace(/,/g, '').trim()
  if (!/^\d*\.?\d{0,2}$/.test(clean) || clean === '' || clean === '.') return Number.NaN
  return Number(clean)
}

export function isValidPledge(state: StakeState, text: string): boolean {
  const amount = parseAmount(text)
  return Number.isFinite(amount) && amount > 0 && amount <= availableToPledge(state)
}

export function stakeMultiplier(state: StakeState): number {
  return multiplierFor(state.boosts)
}

export function currentEstimate(state: StakeState, adding = 0): number {
  const multiplier = stakeMultiplier(state)
  return estimateReward({
    accrued: state.accrued,
    daily: state.pledged * multiplier,
    adding,
    multiplier,
  })
}

export function leaderboardFor(state: StakeState) {
  const multiplier = stakeMultiplier(state)
  return buildLeaderboard(
    state.accrued > 0 ? { pledged: state.snapshotPledged, boost: multiplier, points: state.accrued } : null,
  )
}

export function rankFor(state: StakeState): number | null {
  if (state.accrued <= 0) return null
  return leaderboardFor(state).find((row) => row.you)?.rank ?? null
}

export function hasXbg(state: StakeState): boolean {
  return state.wallet + stakedTotal(state) > 0
}

// The route that describes the state, so the address bar and the review
// selector always name what is on screen.
export function routeFor(state: StakeState, view: StakeView = state.view): StakeScreenId {
  if (view === 'history') return 'stake-history'
  if (view === 'positions') return state.positions.length ? 'stake-positions' : 'stake-positions-empty'
  if (state.pledgeReadFailed) return 'stake-balance-error'
  if (!hasXbg(state)) return 'stake-no-xbg'
  if (state.season === 'upcoming') return 'stake-upcoming'
  if (state.season === 'closed') return 'stake-season-closed'
  if (state.pledged > 0 && availableToPledge(state) <= 0) return 'stake-all-pledged'
  if (state.pledged > 0) return state.eligibility === 'eligible' || state.eligibility === 'unavailable' ? 'stake-active' : 'stake-not-earning'
  if (state.eligibility === 'unavailable') return 'stake-check-unavailable'
  if (state.eligibility === 'unlinked') return 'stake-not-verified'
  if (state.eligibility === 'linked') return 'stake-linked'
  return state.source === 'prometheus' || state.source === 'community' ? 'stake-eligible-nft' : 'stake-eligible'
}

function pledgeOf(state: StakeState) {
  return state.modal?.kind === 'pledge' ? state.modal : null
}

function verifyOf(state: StakeState) {
  return state.modal?.kind === 'verify' ? state.modal : null
}

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function stakeReducer(state: StakeState, action: StakeAction): StakeState {
  switch (action.type) {
    case 'nav':
      return { ...state, view: action.view, modal: null }
    case 'reset':
      return createStakeState(action.screen)

    case 'pledge.open':
      return { ...state, modal: pledgeModal('amount', { amountText: '' }) }
    case 'pledge.amount': {
      const modal = pledgeOf(state)
      if (!modal) return state
      return { ...state, modal: { ...modal, amountText: action.text, error: false } }
    }
    case 'pledge.max': {
      const modal = pledgeOf(state)
      if (!modal) return state
      return { ...state, modal: { ...modal, amountText: String(maxPledge(state)), error: false } }
    }
    case 'pledge.next': {
      const modal = pledgeOf(state)
      if (!modal) return state
      if (!isValidPledge(state, modal.amountText)) return { ...state, modal: { ...modal, error: true } }
      return { ...state, modal: { ...modal, step: 'confirm', phase: 'idle', error: false } }
    }
    case 'pledge.back': {
      const modal = pledgeOf(state)
      if (!modal || modal.phase === 'signing' || modal.phase === 'submitting') return state
      return { ...state, modal: { ...modal, step: 'amount', phase: 'idle' } }
    }
    case 'pledge.sign': {
      const modal = pledgeOf(state)
      if (!modal || state.season !== 'open') return state
      return { ...state, modal: { ...modal, phase: 'signing' } }
    }
    case 'pledge.reject': {
      const modal = pledgeOf(state)
      if (!modal || modal.phase !== 'signing') return state
      return { ...state, modal: { ...modal, phase: 'rejected' } }
    }
    case 'pledge.approve': {
      const modal = pledgeOf(state)
      if (!modal || modal.phase !== 'signing') return state
      return { ...state, modal: { ...modal, phase: 'submitting' } }
    }
    case 'pledge.submitted': {
      const modal = pledgeOf(state)
      if (!modal || modal.phase !== 'submitting') return state
      const amount = parseAmount(modal.amountText)
      if (!Number.isFinite(amount) || amount > availableToPledge(state)) {
        return { ...state, modal: { ...modal, step: 'result', phase: 'idle', result: 'refused' } }
      }
      return {
        ...state,
        pledged: state.pledged + amount,
        modal: { ...modal, step: 'result', phase: 'idle', result: 'done' },
      }
    }
    case 'pledge.refresh': {
      const modal = pledgeOf(state)
      if (!modal) return state
      const amount = parseAmount(modal.amountText)
      const recorded = Number.isFinite(amount) && amount <= availableToPledge(state)
      return {
        ...state,
        pledged: recorded ? state.pledged + amount : state.pledged,
        modal: null,
        toast: recorded ? `Checked. ${formatXbg(amount)} pledge went through.` : 'Checked. Nothing was pledged.',
        toastTone: 'success',
      }
    }

    case 'verify.open':
      return { ...state, modal: verifyModal('email', { email: '' }) }
    case 'verify.email': {
      const modal = verifyOf(state)
      if (!modal) return state
      return { ...state, modal: { ...modal, email: action.text, error: false } }
    }
    case 'verify.next': {
      const modal = verifyOf(state)
      if (!modal) return state
      if (!VALID_EMAIL.test(modal.email.trim())) return { ...state, modal: { ...modal, error: true } }
      return { ...state, modal: { ...modal, step: 'sign', phase: 'idle', error: false } }
    }
    case 'verify.sign': {
      const modal = verifyOf(state)
      if (!modal || modal.phase === 'refused') return state
      return { ...state, modal: { ...modal, phase: 'signing' } }
    }
    case 'verify.reject': {
      const modal = verifyOf(state)
      if (!modal || modal.phase !== 'signing') return state
      return { ...state, modal: { ...modal, phase: 'rejected' } }
    }
    case 'verify.approve': {
      const modal = verifyOf(state)
      if (!modal || modal.phase !== 'signing') return state
      // An email already linked to another wallet is refused. The demo uses
      // any address containing "taken" to show it.
      if (/taken/i.test(modal.email)) return { ...state, modal: { ...modal, phase: 'refused' } }
      return {
        ...state,
        eligibility: state.eligibility === 'eligible' ? 'eligible' : 'linked',
        email: modal.email.trim(),
        modal: { ...modal, step: 'done', phase: 'idle' },
      }
    }

    case 'eligibility.recheck':
      if (state.checking) return state
      return { ...state, checking: action.source }
    case 'eligibility.checked': {
      if (!state.checking) return state
      // The demo treats a re-check as finding the purchase or plan.
      return {
        ...state,
        checking: null,
        eligibility: 'eligible',
        source: state.checking,
        toast: 'Eligibility updated.',
        toastTone: 'success',
      }
    }

    case 'buy.open':
      return { ...state, modal: { kind: 'buy' } }
    case 'buy.simulate':
      return {
        ...state,
        wallet: state.wallet + DEMO_WALLET.balance,
        modal: null,
        toast: `${formatXbg(DEMO_WALLET.balance)} added to the demo wallet.`,
        toastTone: 'success',
      }

    case 'leaderboard.open':
      return { ...state, modal: { kind: 'leaderboard', shown: 20 } }
    case 'leaderboard.more':
      if (state.modal?.kind !== 'leaderboard') return state
      return { ...state, modal: { ...state.modal, shown: state.modal.shown + 20 } }
    case 'allocations.open':
      return { ...state, modal: { kind: 'allocations', shown: 25 } }
    case 'allocations.more':
      if (state.modal?.kind !== 'allocations') return state
      return { ...state, modal: { ...state.modal, shown: state.modal.shown + 25 } }
    case 'history.more':
      return { ...state, historyShown: state.historyShown + 4 }
    case 'boosts.toggle':
      return { ...state, boostsOpen: !state.boostsOpen }

    case 'unstake.start': {
      const position = state.positions.find((p) => p.id === action.id)
      if (!position || position.withdrawn || position.daysLeft > 0) return state
      return { ...state, unstake: { ...state.unstake, [action.id]: 'wallet' }, modal: { kind: 'unstake', positionId: action.id } }
    }
    case 'unstake.reject': {
      if (state.modal?.kind !== 'unstake') return state
      return { ...state, modal: null, unstake: { ...state.unstake, [state.modal.positionId]: 'rejected' } }
    }
    case 'unstake.approve': {
      if (state.modal?.kind !== 'unstake') return state
      return { ...state, modal: null, unstake: { ...state.unstake, [state.modal.positionId]: 'confirming' } }
    }
    case 'unstake.confirmed': {
      const position = state.positions.find((p) => p.id === action.id)
      if (!position || state.unstake[action.id] !== 'confirming') return state
      return {
        ...state,
        wallet: state.wallet + position.amount,
        positions: state.positions.map((p) => (p.id === action.id ? { ...p, withdrawn: true } : p)),
        unstake: { ...state.unstake, [action.id]: 'done' },
        toast: 'Unstaked successfully',
        toastTone: 'success',
      }
    }

    case 'modal.close': {
      const modal = state.modal
      // A pledge being submitted cannot be dismissed, as on the live page.
      if (modal?.kind === 'pledge' && modal.phase === 'submitting') return state
      if (modal?.kind === 'unstake') {
        return { ...state, modal: null, unstake: { ...state.unstake, [modal.positionId]: 'rejected' } }
      }
      return { ...state, modal: null }
    }
    case 'toast.clear':
      return { ...state, toast: null }
    default:
      return state
  }
}
