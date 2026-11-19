import { describe, expect, it } from 'vitest'
import { SCREENS, type StakeScreenId } from '../screens'
import { SEASON, estimateReward, formatXbg, visitorExample } from '../components/stake/config'
import {
  availableToPledge,
  createStakeState,
  currentEstimate,
  rankFor,
  routeFor,
  stakeReducer,
  type StakeAction,
  type StakeState,
} from '../components/stake/demoState'

function run(state: StakeState, ...actions: StakeAction[]): StakeState {
  return actions.reduce(stakeReducer, state)
}

describe('Stake figures', () => {
  it('matches the live visitor example of 403 XBG for 100,000 XBG', () => {
    expect(Math.round(visitorExample())).toBe(403)
  })

  it('estimates the active holder from points accrued and the snapshots left', () => {
    const active = createStakeState('stake-active')
    expect(Math.round(currentEstimate(active))).toBe(1_307)
    expect(estimateReward({ accrued: 0, daily: 0, multiplier: 1 })).toBe(0)
  })

  it('counts staked XBG towards the amount that can be pledged', () => {
    const holder = createStakeState('stake-eligible')
    expect(availableToPledge(holder)).toBe(48_750 + 250_000)
    expect(availableToPledge(createStakeState('stake-all-pledged'))).toBe(0)
  })

  it('ranks only wallets with points from a snapshot', () => {
    expect(rankFor(createStakeState('stake-active'))).toBeGreaterThan(3)
    expect(rankFor(createStakeState('stake-active'))).toBeLessThanOrEqual(SEASON.participants)
    expect(rankFor(createStakeState('stake-eligible'))).toBeNull()
  })
})

describe('Stake review states', () => {
  const pageStates = SCREENS.filter((s) => s.group === 'Stake' && s.id !== 'stake-entry' && s.id !== 'stake-restricted')

  it('every page state names itself, so the address and the selector agree', () => {
    for (const { id } of pageStates) {
      expect(routeFor(createStakeState(id as StakeScreenId)), id).toBe(id)
    }
  })

  it('every dialog state opens its dialog', () => {
    for (const { id } of SCREENS.filter((s) => s.group === 'Stake dialogs')) {
      expect(createStakeState(id as StakeScreenId).modal, id).not.toBeNull()
    }
  })
})

describe('pledge flow', () => {
  it('rejects empty, malformed and too large amounts', () => {
    const open = run(createStakeState('stake-eligible'), { type: 'pledge.open' })
    for (const text of ['', '0', 'abc', '1.234', '298751']) {
      const next = run(open, { type: 'pledge.amount', text }, { type: 'pledge.next' })
      expect(next.modal, text).toMatchObject({ step: 'amount', error: true })
    }
  })

  it('fills MAX with the available amount and pledges after a signature', () => {
    let state = run(createStakeState('stake-eligible'), { type: 'pledge.open' }, { type: 'pledge.max' })
    expect(state.modal).toMatchObject({ amountText: '298750' })
    state = run(
      state,
      { type: 'pledge.amount', text: '25000' },
      { type: 'pledge.next' },
      { type: 'pledge.sign' },
      { type: 'pledge.reject' },
    )
    expect(state.modal).toMatchObject({ step: 'confirm', phase: 'rejected' })
    expect(state.pledged).toBe(0)
    state = run(state, { type: 'pledge.sign' }, { type: 'pledge.approve' })
    expect(state.modal).toMatchObject({ phase: 'submitting' })
    expect(run(state, { type: 'modal.close' }).modal).not.toBeNull()
    state = run(state, { type: 'pledge.submitted' })
    expect(state.modal).toMatchObject({ step: 'result', result: 'done' })
    expect(state.pledged).toBe(25_000)
    expect(routeFor(run(state, { type: 'modal.close' }))).toBe('stake-active')
  })

  it('adds a second pledge to the season total', () => {
    const state = run(
      createStakeState('stake-active'),
      { type: 'pledge.open' },
      { type: 'pledge.amount', text: '10000' },
      { type: 'pledge.next' },
      { type: 'pledge.sign' },
      { type: 'pledge.approve' },
      { type: 'pledge.submitted' },
    )
    expect(state.pledged).toBe(260_000)
    // Points and rank keep the last snapshot.
    expect(state.snapshotPledged).toBe(250_000)
  })

  it('cannot sign while the season is closed', () => {
    const closed = { ...createStakeState('stake-season-closed'), modal: createStakeState('stake-pledge-confirm').modal }
    expect(run(closed, { type: 'pledge.sign' }).modal).toMatchObject({ phase: 'idle' })
  })
})

describe('verify and eligibility', () => {
  it('links an email without making the wallet eligible', () => {
    const state = run(
      createStakeState('stake-not-verified'),
      { type: 'verify.open' },
      { type: 'verify.email', text: 'trader@example.com' },
      { type: 'verify.next' },
      { type: 'verify.sign' },
      { type: 'verify.approve' },
      { type: 'modal.close' },
    )
    expect(state.eligibility).toBe('linked')
    expect(routeFor(state)).toBe('stake-linked')
    const checked = run(state, { type: 'eligibility.recheck', source: 'fanbase' }, { type: 'eligibility.checked' })
    expect(checked.eligibility).toBe('eligible')
    expect(checked.source).toBe('fanbase')
  })

  it('refuses an email already linked elsewhere', () => {
    const state = run(
      createStakeState('stake-verify-email'),
      { type: 'verify.email', text: 'taken@example.com' },
      { type: 'verify.next' },
      { type: 'verify.sign' },
      { type: 'verify.approve' },
    )
    expect(state.modal).toMatchObject({ phase: 'refused' })
    expect(state.email).toBeNull()
  })
})

describe('staking positions', () => {
  it('unstakes only an ended position and returns its XBG to the wallet', () => {
    const active = createStakeState('stake-positions')
    expect(run(active, { type: 'unstake.start', id: 1 }).modal).toBeNull()
    const confirmed = run(active, { type: 'unstake.start', id: 2 }, { type: 'unstake.approve' }, { type: 'unstake.confirmed', id: 2 })
    expect(confirmed.wallet).toBe(active.wallet + 70_000)
    expect(confirmed.positions.find((p) => p.id === 2)?.withdrawn).toBe(true)
    expect(availableToPledge(confirmed)).toBe(availableToPledge(active))
    expect(confirmed.toast).toBe('Unstaked successfully')
  })

  it('a rejected transaction changes nothing', () => {
    const active = createStakeState('stake-positions')
    const rejected = run(active, { type: 'unstake.start', id: 2 }, { type: 'unstake.reject' })
    expect(rejected.unstake[2]).toBe('rejected')
    expect(rejected.wallet).toBe(active.wallet)
  })
})

describe('buying XBG', () => {
  it('a demo purchase moves a wallet with no XBG to the not verified state', () => {
    const state = run(createStakeState('stake-no-xbg'), { type: 'buy.open' }, { type: 'buy.simulate' })
    expect(routeFor(state)).toBe('stake-not-verified')
    expect(state.toast).toBe(`${formatXbg(48_750)} added to the demo wallet.`)
  })
})
