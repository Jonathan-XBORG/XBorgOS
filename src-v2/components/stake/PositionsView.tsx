import { ALLOCATION_SUMMARY, PROPR_ALLOCATION, formatCompact, formatXbg, type Position } from './config'
import type { StakeAction, StakeState, UnstakePhase } from './demoState'

const propr = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

function UnstakeControl({
  position,
  phase,
  dispatch,
}: {
  position: Position
  phase: UnstakePhase
  dispatch: React.Dispatch<StakeAction>
}) {
  if (phase === 'wallet') {
    return (
      <button type="button" className="btn btn-secondary is-pending" disabled aria-busy="true">
        Confirm in wallet…
      </button>
    )
  }
  if (phase === 'confirming') {
    return (
      <button type="button" className="btn btn-secondary is-pending" disabled aria-busy="true">
        Confirming…
      </button>
    )
  }
  return (
    <div className="unstake-control">
      {phase === 'rejected' ? (
        <p className="form-error" role="alert">
          Transaction rejected
        </p>
      ) : null}
      <button type="button" className="btn btn-secondary" onClick={() => dispatch({ type: 'unstake.start', id: position.id })}>
        Unstake XBG
      </button>
    </div>
  )
}

function PositionCard({ position, phase, dispatch }: { position: Position; phase: UnstakePhase; dispatch: React.Dispatch<StakeAction> }) {
  const ready = !position.withdrawn && position.daysLeft === 0
  const progress = position.withdrawn || ready ? 100 : Math.max(4, 100 - (position.daysLeft / 365) * 100)

  return (
    <article className={`position-card${position.withdrawn ? ' is-withdrawn' : ''}`} data-position={position.id}>
      <div className="position-head">
        <h3>Position {position.id}</h3>
        <strong>{formatXbg(position.amount)}</strong>
      </div>
      <dl className="position-meta">
        <div><dt>Term</dt><dd>{position.term}</dd></div>
        <div><dt>Multiplier</dt><dd>{position.multiplier}</dd></div>
      </dl>
      <div className="season-progress" role="img" aria-label={position.withdrawn ? 'Unstaked' : ready ? 'Term complete' : `${position.daysLeft} days left`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="season-panel-footer">
        <span>
          {phase === 'done' || position.withdrawn
            ? 'Unstaked, XBG returned to your wallet'
            : ready
              ? 'Available to unstake'
              : `Staked until ${position.until}`}
        </span>
        <span>{position.withdrawn ? `Ran until ${position.until}` : ready ? 'Ready to unstake' : `${position.daysLeft} days left`}</span>
      </div>
      {phase === 'done' ? (
        <p className="success-line" role="status">
          Unstaked successfully
        </p>
      ) : null}
      {ready && phase !== 'done' ? <UnstakeControl position={position} phase={phase} dispatch={dispatch} /> : null}
    </article>
  )
}

export default function PositionsView({
  state,
  dispatch,
  onRewards,
}: {
  state: StakeState
  dispatch: React.Dispatch<StakeAction>
  onRewards: () => void
}) {
  if (!state.positions.length) {
    return (
      <div className="portal-page positions-page">
        <div className="portal-page-heading">
          <p className="portal-kicker">Staking</p>
          <h1>Your positions</h1>
        </div>
        <section className="portal-empty-state" aria-labelledby="no-positions-title">
          <h2 id="no-positions-title">No staking positions</h2>
          <p>
            New staking is closed. Pledging does not need a staking position: your XBG stays in your wallet and counts
            as it is.
          </p>
          <button type="button" className="btn btn-primary" onClick={onRewards}>
            Go to rewards
          </button>
        </section>
      </div>
    )
  }

  const allWithdrawn = state.positions.every((p) => p.withdrawn)

  return (
    <div className="portal-page positions-page">
      <div className="portal-page-heading">
        <p className="portal-kicker">Staking</p>
        <h1>Your positions</h1>
        <p>
          {allWithdrawn
            ? 'New staking is closed. You have unstaked everything, and the PROPR you earned while staked is still yours.'
            : 'New staking is closed. Your positions are untouched and end on their original dates.'}
        </p>
        <div className="chip-row">
          <span className="status-badge">Campaign closed</span>
        </div>
      </div>

      <section className="staking-module allocation-card" data-section="allocation" aria-labelledby="allocation-title">
        <div className="lead-grid">
          <div className="lead-figure-block">
            <h2 id="allocation-title" className="lead-label">Final allocation confirmed</h2>
            <strong className="lead-figure" data-figure="propr">
              {propr.format(PROPR_ALLOCATION)}
              <span> PROPR</span>
            </strong>
          </div>
          <div className="lead-action">
            <button type="button" className="btn btn-secondary" onClick={() => dispatch({ type: 'allocations.open' })}>
              See final allocations
            </button>
            <span className="section-note">
              {formatCompact(ALLOCATION_SUMMARY.walletXbg)} XBG across {ALLOCATION_SUMMARY.wallets} wallets
            </span>
          </div>
        </div>
      </section>

      <section className="portal-section" data-section="positions" aria-label="Positions">
        <div className="position-list">
          {state.positions.map((position) => (
            <PositionCard key={position.id} position={position} phase={state.unstake[position.id] ?? 'idle'} dispatch={dispatch} />
          ))}
        </div>
      </section>
    </div>
  )
}
