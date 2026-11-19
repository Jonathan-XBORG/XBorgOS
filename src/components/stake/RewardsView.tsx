import {
  BOOSTS,
  HOW_IT_WORKS,
  NEXT_SEASON,
  REQUIREMENTS,
  SEASON,
  SOURCE_LABELS,
  boostCountLine,
  formatCompact,
  formatMultiplier,
  formatNumber,
  formatXbg,
} from './config'
import {
  availableToPledge,
  currentEstimate,
  hasXbg,
  rankFor,
  stakeMultiplier,
  stakedTotal,
  type StakeAction,
  type StakeState,
} from './demoState'

export function seasonKicker(state: Pick<StakeState, 'season'>): string {
  if (state.season === 'upcoming') return `XBG Rewards · Season ${NEXT_SEASON.number} opens ${NEXT_SEASON.opens}`
  if (state.season === 'closed') return `XBG Rewards · Season ${SEASON.number} closed`
  return `XBG Rewards · Season ${SEASON.number}`
}

export function EligibilityChip({ state }: { state: StakeState }) {
  if (state.eligibility === 'unavailable') return <span className="status-badge">Verification temporarily unavailable</span>
  if (state.eligibility === 'unlinked' && !state.source) return <span className="status-badge">Not verified</span>
  if (state.eligibility === 'eligible' && state.source) {
    return <span className="status-badge is-available">Eligible · {SOURCE_LABELS[state.source]}</span>
  }
  return <span className="status-badge is-error">{state.season === 'upcoming' ? 'Not eligible yet' : 'Not eligible'}</span>
}

function LeadAction({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  if (state.pledgeReadFailed) {
    return (
      <button type="button" className="btn btn-primary portal-primary-action" disabled>
        Balance unavailable
      </button>
    )
  }
  if (!hasXbg(state)) {
    return (
      <button type="button" className="btn btn-primary portal-primary-action" onClick={() => dispatch({ type: 'buy.open' })}>
        Buy XBG
      </button>
    )
  }
  if (state.season === 'upcoming') {
    return (
      <button type="button" className="btn btn-primary portal-primary-action" disabled>
        Season {NEXT_SEASON.number} opens {NEXT_SEASON.opensShort}
      </button>
    )
  }
  if (state.season === 'closed') {
    return (
      <button type="button" className="btn btn-primary portal-primary-action" disabled>
        Season {NEXT_SEASON.number} opens soon
      </button>
    )
  }
  if (state.pledged > 0 && availableToPledge(state) <= 0) {
    return <span className="status-badge is-available lead-note">All of your XBG is pledged</span>
  }
  return (
    <button type="button" className="btn btn-primary portal-primary-action" onClick={() => dispatch({ type: 'pledge.open' })}>
      {state.pledged > 0 ? 'Pledge more' : 'Pledge XBG'}
    </button>
  )
}

function LeadCard({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  const eligible = state.eligibility === 'eligible' || state.eligibility === 'unavailable'
  const earning = state.pledged > 0 && eligible
  const estimate = currentEstimate(state)
  const showsRequirements = state.eligibility === 'unlinked' || state.eligibility === 'linked'
  const inactive = showsRequirements && state.pledged > 0
  const progress = state.season === 'open' ? ((SEASON.length - SEASON.daysLeft) / SEASON.length) * 100 : state.season === 'closed' ? 100 : 0

  return (
    <section className={`staking-module lead-card${inactive ? ' is-inactive' : ''}`} data-section="pledge" aria-labelledby="lead-title">
      <div className="lead-grid">
        <div className="lead-figure-block">
          <h2 id="lead-title" className="lead-label">Your pledged XBG</h2>
          {state.pledgeReadFailed ? (
            <strong className="lead-figure">Unavailable</strong>
          ) : (
            <strong className="lead-figure" data-figure="pledged">
              {formatNumber(state.pledged)}
              <span> XBG</span>
            </strong>
          )}
          {state.pledgeReadFailed ? (
            <p className="form-error" role="alert">
              We couldn’t load your pledged balance just now. Refresh the page before pledging, so you don’t pledge twice.
            </p>
          ) : null}
          {state.pledged > 0 && !state.pledgeReadFailed ? (
            <p className={`lead-status${earning ? ' is-earning' : ''}`}>
              <span className="status-dot" aria-hidden="true" />
              Pledged for Season {SEASON.number} · {earning ? 'earning' : 'not earning yet'}
            </p>
          ) : null}
          {state.season === 'open' && state.pledged > 0 && earning && estimate > 0 ? (
            <p className="lead-line" data-figure="estimate">
              Earning about <strong>{formatXbg(estimate)}</strong> this season if the pool holds.
            </p>
          ) : null}
          {state.season === 'open' && state.pledged > 0 && !eligible ? (
            <p className="lead-line">
              Earning <strong>0 XBG</strong> so far. Complete a requirement below to start earning about {formatXbg(estimate)}.
            </p>
          ) : null}
          {state.pledged === 0 && !state.pledgeReadFailed && hasXbg(state) && state.season === 'open' ? (
            <p className="lead-line">Pledge XBG you hold to share in this season’s {formatXbg(SEASON.pool)} pool.</p>
          ) : null}
          {!hasXbg(state) ? <p className="lead-line">This wallet holds no XBG yet. Get some to pledge this season.</p> : null}
        </div>
        <div className="lead-action">
          <LeadAction state={state} dispatch={dispatch} />
        </div>
      </div>

      <div className="season-progress" aria-label={`Season ${SEASON.number} progress`} role="img">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="season-panel-footer">
        <span>Season {state.season === 'upcoming' ? NEXT_SEASON.number : SEASON.number}</span>
        <span>
          {state.season === 'open'
            ? `${SEASON.daysLeft} days left`
            : state.season === 'upcoming'
              ? `Opens ${NEXT_SEASON.opens}`
              : 'Closed'}
        </span>
      </div>

      <dl className="balance-row" aria-label="Wallet balance">
        <div><dt>In wallet</dt><dd>{formatXbg(state.wallet)}</dd></div>
        <div><dt>Staked</dt><dd>{formatXbg(stakedTotal(state))}</dd></div>
        <div><dt>Total</dt><dd>{formatXbg(state.wallet + stakedTotal(state))}</dd></div>
        <p>Both count towards a pledge.</p>
      </dl>
    </section>
  )
}

function Requirements({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  return (
    <section className="portal-section" data-section="requirements" aria-labelledby="requirements-title">
      <div className="section-heading-row">
        <h2 id="requirements-title">Complete any option to activate rewards</h2>
      </div>
      <div className="requirement-grid">
        {REQUIREMENTS.map((item) => {
          const checking = state.checking === item.id
          return (
            <article className="requirement-card" key={item.id} data-requirement={item.id}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="requirement-actions">
                <a className="btn btn-secondary btn-sm" href={item.href} target="_blank" rel="noreferrer">
                  {item.action}
                </a>
                {item.viaEmail ? (
                  checking ? (
                    <button type="button" className="btn btn-quiet btn-sm is-pending" disabled aria-busy="true">
                      Checking…
                    </button>
                  ) : state.eligibility === 'unlinked' ? (
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => dispatch({ type: 'verify.open' })}>
                      Verify
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-quiet btn-sm"
                      disabled={Boolean(state.checking)}
                      onClick={() => dispatch({ type: 'eligibility.recheck', source: item.id })}
                    >
                      Re-check
                    </button>
                  )
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function MultiplierCard({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  const active = state.boosts
  const available = BOOSTS.filter((boost) => !active.some((a) => a.key === boost.key))
  const gated = state.season !== 'open' || !hasXbg(state)

  return (
    <section className="portal-section" data-section="multiplier" aria-labelledby="multiplier-title">
      <div className="multiplier-card">
        <div className="section-heading-row">
          <div>
            <h2 id="multiplier-title">Your multiplier</h2>
            <p className="section-note">Base multiplier plus your active boosts</p>
          </div>
          <strong className="multiplier-value" data-figure="multiplier">{formatMultiplier(stakeMultiplier(state))}</strong>
        </div>
        <h3 className="list-heading">Active boosts {active.length}</h3>
        {active.length ? (
          <ul className="boost-list">
            {active.map((boost) => {
              const meta = BOOSTS.find((b) => b.key === boost.key)
              return (
                <li key={boost.key}>
                  <div>
                    <strong>{meta?.label}</strong>
                    <span>{boostCountLine(boost) ?? meta?.detail}</span>
                  </div>
                  <span className="boost-value">+{Math.round(boost.value * 1000) / 10}%</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="section-note">No boosts are active yet. Explore the catalogue below to add to your share.</p>
        )}
        {state.pledged > 0 && state.streak > 0 ? (
          <p className="section-note">
            {state.streak} season streak active. Pledge every season to keep it. Missing one resets your bonus.
          </p>
        ) : null}
        <button
          type="button"
          className="text-action"
          aria-expanded={state.boostsOpen}
          aria-controls="available-boosts"
          onClick={() => dispatch({ type: 'boosts.toggle' })}
        >
          {state.boostsOpen ? 'Hide available boosts' : 'See all boosts'}
        </button>
        {state.boostsOpen ? (
          <div id="available-boosts">
            <h3 className="list-heading">Available boosts {available.length}</h3>
            <ul className="boost-list">
              {available.map((boost) => (
                <li key={boost.key}>
                  <div>
                    <strong>{boost.label}</strong>
                    <span>{boost.detail}</span>
                  </div>
                  <span className="boost-value">{boost.range}</span>
                  {boost.kind === 'pledge' ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={gated}
                      onClick={() => dispatch({ type: 'pledge.open' })}
                    >
                      {boost.action}
                    </button>
                  ) : (
                    <a className="btn btn-secondary btn-sm" href={boost.href} target="_blank" rel="noreferrer" aria-label={`${boost.action}: ${boost.label}`}>
                      {boost.action}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function SeasonStats({
  state,
  visitor = false,
  onLeaderboard,
}: {
  state: Pick<StakeState, 'season'> & Partial<StakeState>
  visitor?: boolean
  onLeaderboard: () => void
}) {
  const rank = visitor ? null : rankFor(state as StakeState)
  const status = state.season === 'open' ? 'live' : state.season === 'upcoming' ? `opens ${NEXT_SEASON.opens}` : 'closed'
  return (
    <section className="portal-section" data-section="season" aria-labelledby="season-stats-title">
      <h2 id="season-stats-title" className="portal-kicker stats-title">
        Season {state.season === 'upcoming' ? NEXT_SEASON.number : SEASON.number} · {status}
      </h2>
      <div className="season-panel stats-card">
        <div className="season-metrics">
          <div>
            <span>Pool this season</span>
            <strong>{formatXbg(SEASON.pool)}</strong>
          </div>
          <div>
            <span>XBG pledged</span>
            <strong>{formatCompact(SEASON.totalPledged)}</strong>
          </div>
          <div>
            <span>Pledgers all time</span>
            <strong>{SEASON.pledgersAllTime}</strong>
          </div>
          <div data-metric="rank">
            <span>{visitor ? 'Leaderboard' : 'Your rank'}</span>
            <strong>
              {visitor ? `${SEASON.participants} wallets` : rank ? `#${rank} of ${SEASON.participants}` : 'Not ranked yet'}
            </strong>
            <button type="button" className="text-action" onClick={onLeaderboard}>
              View leaderboard
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section className="portal-section" data-section="how" aria-labelledby="how-title">
      <h2 id="how-title" className="portal-kicker stats-title">How it works</h2>
      <ol className="how-list">
        {HOW_IT_WORKS.map((step) => (
          <li key={step.title}>
            <strong>{step.title}</strong>
            <span>{step.body}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function RewardsView({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  const showsRequirements = state.eligibility === 'unlinked' || state.eligibility === 'linked'
  const active = state.pledged > 0 && state.eligibility === 'eligible' && state.season === 'open'

  return (
    <div className="portal-page rewards-page">
      <div className="portal-page-heading">
        <p className="portal-kicker">{seasonKicker(state)}</p>
        <h1>Hold XBG, earn XBG</h1>
        <p>
          Every season we share {formatXbg(SEASON.pool)} with wallets that pledge XBG. Your XBG stays in your wallet the
          whole time.
        </p>
        <div className="chip-row" aria-label="Status">
          <EligibilityChip state={state} />
          {active ? <span className="status-badge is-available">Active</span> : null}
        </div>
      </div>
      <LeadCard state={state} dispatch={dispatch} />
      {showsRequirements ? <Requirements state={state} dispatch={dispatch} /> : null}
      <MultiplierCard state={state} dispatch={dispatch} />
      <SeasonStats state={state} onLeaderboard={() => dispatch({ type: 'leaderboard.open' })} />
      {state.positions.length === 0 ? <HowItWorks /> : null}
    </div>
  )
}
