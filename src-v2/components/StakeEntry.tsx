import { useReducer } from 'react'
import { IconMark } from './Icons'
import { SEASON, formatCompact, formatNumber, formatXbg, visitorExample } from './stake/config'
import { createStakeState, stakeReducer } from './stake/demoState'
import { HowItWorks, SeasonStats } from './stake/RewardsView'
import { LeaderboardDialog } from './stake/StakeDialogs'

export const STAKE_ENTRY_TITLE = 'Hold XBG, earn XBG'

// The visitor view of Stake: what the season pays and how it works, with one
// action, Connect Wallet. Wallet states take over once connected.
export default function StakeEntry({
  onConnect,
  connecting = false,
  restricted = false,
  onHome,
}: {
  onConnect: () => void
  connecting?: boolean
  restricted?: boolean
  onHome: () => void
}) {
  // Visitors can open the public leaderboard. No wallet means no rank.
  const [board, dispatch] = useReducer(stakeReducer, 'stake-no-xbg', createStakeState)

  if (restricted) {
    return (
      <main className="portal-app portal-entry is-embedded" tabIndex={-1}>
        <section className="portal-entry-content" aria-labelledby="stake-restricted-title">
          <span className="portal-entry-mark" aria-hidden="true">
            <IconMark />
          </span>
          <h1 id="stake-restricted-title">Service unavailable</h1>
          <p>
            XBorg Staking is not available in your region due to regulatory restrictions. Users from the United States,
            United Kingdom, and OFAC sanctioned jurisdictions are unable to access this service.
          </p>
          <button type="button" className="btn btn-primary portal-primary-action" onClick={onHome}>
            Back to Homepage
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="portal-app portal-entry is-embedded stake-entry" tabIndex={-1}>
      <section className="portal-entry-content" aria-labelledby="portal-entry-title">
        <span className="portal-entry-mark" aria-hidden="true">
          <IconMark />
        </span>
        <p className="portal-kicker">XBG Rewards · Season {SEASON.number}</p>
        <h1 id="portal-entry-title">{STAKE_ENTRY_TITLE}</h1>
        <p>
          Every season we share {formatXbg(SEASON.pool)} with wallets that pledge XBG. Your XBG stays in your wallet the
          whole time.
        </p>
        <div className="chip-row">
          <span className="status-badge is-available">Tokens stay in your wallet</span>
          <span className="status-badge">{formatCompact(SEASON.totalPledged)} XBG pledged</span>
        </div>
        <div className="staking-module entry-estimate" data-section="estimate">
          <p className="lead-label">With 100,000 XBG and no boosts, you could earn about:</p>
          <strong className="lead-figure" data-figure="example">
            {formatNumber(visitorExample())}
            <span> XBG</span>
          </strong>
          <p className="section-note">Your share depends on how much XBG everyone pledges, so this moves during the season.</p>
          <button
            type="button"
            className={`btn btn-primary portal-primary-action${connecting ? ' is-loading' : ''}`}
            aria-busy={connecting || undefined}
            onClick={onConnect}
          >
            Connect Wallet
          </button>
        </div>
      </section>
      <div className="entry-more">
        <SeasonStats state={{ season: 'open' }} visitor onLeaderboard={() => dispatch({ type: 'leaderboard.open' })} />
        <HowItWorks />
      </div>
      <LeaderboardDialog state={board} dispatch={dispatch} />
    </main>
  )
}
