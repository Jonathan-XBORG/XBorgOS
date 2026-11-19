import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useReducer, useRef, type ReactNode } from 'react'
import type { NavigationSource, ScreenId, StakeScreenId } from '../../screens'
import { createStakeState, routeFor, stakeReducer, type StakeView } from './demoState'
import HistoryView from './HistoryView'
import PledgeDialog from './PledgeDialog'
import PositionsView from './PositionsView'
import RewardsView from './RewardsView'
import { AllocationsDialog, BuyDialog, LeaderboardDialog, UnstakeDialog } from './StakeDialogs'
import VerifyDialog from './VerifyDialog'

// Simulated service and chain delays. Short enough to review, long enough to see.
export const SUBMIT_DELAY_MS = 1_200
export const CHECK_DELAY_MS = 900
export const CONFIRM_DELAY_MS = 1_400

const ITEMS: { id: StakeView; label: string; icon: ReactNode }[] = [
  {
    id: 'rewards',
    label: 'Rewards',
    icon: <path d="M12 3v18M8 7.5C8.8 6.5 10.1 6 12 6c2.2 0 3.8 1.1 3.8 2.7 0 4.3-7.6 1.5-7.6 5.8 0 1.6 1.6 2.8 3.8 2.8 1.9 0 3.3-.6 4.2-1.7" />,
  },
  {
    id: 'positions',
    label: 'Positions',
    icon: <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5zM12 15v2" />,
  },
  {
    id: 'history',
    label: 'History',
    icon: <path d="M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4" />,
  },
]

function NavItems({ view, onChange }: { view: StakeView; onChange: (view: StakeView) => void }) {
  return ITEMS.map((item) => (
    <button
      key={item.id}
      type="button"
      className={view === item.id ? 'is-on' : ''}
      aria-current={view === item.id ? 'page' : undefined}
      onClick={() => onChange(item.id)}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        {item.icon}
      </svg>
      <span>{item.label}</span>
    </button>
  ))
}

function routeIsView(route: ScreenId, state: ReturnType<typeof createStakeState>): StakeView | null {
  for (const view of ['rewards', 'positions', 'history'] as StakeView[]) {
    if (routeFor(state, view) === route) return view
  }
  return null
}

export default function Stake({
  screen,
  navigationSource,
  onGo,
  onReset,
}: {
  screen: StakeScreenId
  navigationSource: NavigationSource
  onGo: (id: ScreenId) => void
  onReset: () => void
}) {
  const [state, dispatch] = useReducer(stakeReducer, screen, createStakeState)
  const reduceMotion = useReducedMotion()
  const previousScreen = useRef<ScreenId>(screen)

  // Arriving on a route from outside, from the review selector or from history.
  useEffect(() => {
    if (previousScreen.current === screen) return
    previousScreen.current = screen
    const view = navigationSource === 'history' ? routeIsView(screen, state) : null
    if (view) dispatch({ type: 'nav', view })
    else dispatch({ type: 'reset', screen })
    // The state is read only to decide whether history can keep it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationSource, screen])

  // The address names what is on screen once no dialog is open, so back and
  // forward step through the journey and every state can be linked.
  const target = state.modal ? null : routeFor(state)
  const lastTarget = useRef(target)
  useEffect(() => {
    if (target === lastTarget.current) return
    lastTarget.current = target
    if (!target || target === previousScreen.current) return
    previousScreen.current = target
    onGo(target)
  }, [target, onGo])

  // Simulated round trips.
  const pledgePhase = state.modal?.kind === 'pledge' ? state.modal.phase : null
  useEffect(() => {
    if (pledgePhase !== 'submitting') return
    const timer = window.setTimeout(() => dispatch({ type: 'pledge.submitted' }), SUBMIT_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [pledgePhase])

  useEffect(() => {
    if (!state.checking) return
    const timer = window.setTimeout(() => dispatch({ type: 'eligibility.checked' }), CHECK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [state.checking])

  const confirming = Object.entries(state.unstake).find(([, phase]) => phase === 'confirming')?.[0]
  useEffect(() => {
    if (!confirming) return
    const id = Number(confirming)
    const timer = window.setTimeout(() => dispatch({ type: 'unstake.confirmed', id }), CONFIRM_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [confirming])

  useEffect(() => {
    if (!state.toast) return
    const timeout = window.setTimeout(() => dispatch({ type: 'toast.clear' }), 4_500)
    return () => window.clearTimeout(timeout)
  }, [state.toast])

  function go(view: StakeView) {
    dispatch({ type: 'nav', view })
  }

  const resetButton = (
    <button type="button" className="btn btn-quiet btn-sm portal-reset" onClick={onReset}>
      Reset Demo State
    </button>
  )

  return (
    <main className="portal-app is-embedded stake-app">
      <div className="portal-shell">
        <div className="portal-sidebar">
          <nav className="portal-tabs" aria-label="Stake">
            <NavItems view={state.view} onChange={go} />
          </nav>
          <nav className="portal-tabbar" aria-label="Stake">
            <NavItems view={state.view} onChange={go} />
          </nav>
          {resetButton}
        </div>
        <div className="portal-body" tabIndex={-1}>
          {state.view === 'rewards' ? <RewardsView state={state} dispatch={dispatch} /> : null}
          {state.view === 'positions' ? <PositionsView state={state} dispatch={dispatch} onRewards={() => go('rewards')} /> : null}
          {state.view === 'history' ? <HistoryView state={state} dispatch={dispatch} /> : null}
          <div className="portal-page-foot">{resetButton}</div>
        </div>
      </div>

      <PledgeDialog state={state} dispatch={dispatch} />
      <VerifyDialog state={state} dispatch={dispatch} />
      <LeaderboardDialog state={state} dispatch={dispatch} />
      <AllocationsDialog state={state} dispatch={dispatch} />
      <BuyDialog state={state} dispatch={dispatch} />
      <UnstakeDialog state={state} dispatch={dispatch} />

      <div className="portal-live-region" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {state.toast ? (
            <motion.div
              className={`portal-toast is-${state.toastTone}`}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            >
              <span className="toast-mark" aria-hidden="true">{state.toastTone === 'error' ? '!' : '✓'}</span>
              {state.toast}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  )
}
