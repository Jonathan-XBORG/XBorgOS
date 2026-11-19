import {
  ALLOCATION_SUMMARY,
  BUY_VENUES,
  DEMO_WALLET,
  SEASON,
  allocationRows,
  formatMultiplier,
  formatNumber,
  formatXbg,
  type LeaderboardRow,
} from './config'
import DemoWallet from './DemoWallet'
import { leaderboardFor, type StakeAction, type StakeState } from './demoState'
import ModalShell from './ModalShell'

function formatPoints(value: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value)
}

function LeaderRow({ row }: { row: LeaderboardRow }) {
  return (
    <tr role="row" className={row.you ? 'is-you' : undefined}>
      <td role="cell" data-label="Rank">#{row.rank}</td>
      <td role="cell" data-label="Wallet" className="tx-hash">{row.you ? `${row.wallet} (you)` : row.wallet}</td>
      <td role="cell" data-label="XBG pledged">{formatNumber(row.pledged)}</td>
      <td role="cell" data-label="Current boost">{formatMultiplier(row.boost)}</td>
      <td role="cell" data-label="Season points">{formatPoints(row.points)}</td>
    </tr>
  )
}

export function LeaderboardDialog({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  if (state.modal?.kind !== 'leaderboard') return null
  const live = state.season === 'open'
  const rows = leaderboardFor(state)
  const you = rows.find((row) => row.you)
  const shown = rows.slice(0, state.modal.shown)

  return (
    <ModalShell
      title={`Season ${SEASON.number} leaderboard${live ? ' · live' : ''}`}
      onClose={() => dispatch({ type: 'modal.close' })}
      className="stake-modal table-modal"
      focusKey={`leaderboard:${state.modal.shown}`}
    >
      <div className="stake-step">
        <p className="modal-lead">
          {live
            ? `Ranked by the points each wallet has accumulated from pledged XBG and boosts so far in Season ${SEASON.number}. Points update once a day, and ranks can change until the season closes. Points are not payout figures.`
            : `Ranked by the points accumulated from pledged XBG and boosts during Season ${SEASON.number}. Points are not final payout figures.`}
        </p>
        {you ? (
          <div className="your-rank" data-rank={you.rank}>
            <span>Your rank</span>
            <strong>#{you.rank}</strong>
            <span>
              {formatXbg(you.pledged)} pledged · {formatMultiplier(you.boost)} · {formatPoints(you.points)} points
            </span>
          </div>
        ) : (
          <p className="field-meta">
            {live
              ? `This wallet has no points in Season ${SEASON.number} yet. Points appear after the daily snapshot.`
              : `This wallet did not participate in Season ${SEASON.number}.`}
          </p>
        )}
        <div className="reward-table-wrap stake-table">
          <table aria-label={`Season ${SEASON.number} leaderboard`} role="table">
            <thead role="rowgroup">
              <tr role="row">
                <th role="columnheader">Rank</th>
                <th role="columnheader">Wallet</th>
                <th role="columnheader">XBG pledged</th>
                <th role="columnheader">{live ? 'Current boost' : 'Final boost'}</th>
                <th role="columnheader">Season points</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {shown.map((row) => (
                <LeaderRow key={`${row.rank}-${row.wallet}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
        {shown.length < rows.length ? (
          <button type="button" className="btn btn-secondary" data-step-focus onClick={() => dispatch({ type: 'leaderboard.more' })}>
            Load more
          </button>
        ) : null}
      </div>
    </ModalShell>
  )
}

export function AllocationsDialog({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  if (state.modal?.kind !== 'allocations') return null
  const rows = allocationRows()
  const shown = rows.slice(0, state.modal.shown)
  const proprFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

  return (
    <ModalShell
      title="Final PROPR allocations"
      onClose={() => dispatch({ type: 'modal.close' })}
      className="stake-modal table-modal"
      focusKey={`allocations:${state.modal.shown}`}
    >
      <div className="stake-step">
        <p className="modal-lead">These are the final PROPR estimated allocations per wallet.</p>
        <dl className="summary-strip">
          <div><dt>Total PROPR</dt><dd>{formatNumber(ALLOCATION_SUMMARY.totalPropr)}</dd></div>
          <div><dt>Wallets on chain</dt><dd>{formatNumber(ALLOCATION_SUMMARY.wallets)}</dd></div>
          <div><dt>Positions on chain</dt><dd>{formatNumber(ALLOCATION_SUMMARY.positions)}</dd></div>
          <div><dt>SwissBorg vaults</dt><dd>{ALLOCATION_SUMMARY.vaults}</dd></div>
          <div><dt>Wallet XBG on chain</dt><dd>{formatNumber(ALLOCATION_SUMMARY.walletXbg)}</dd></div>
        </dl>
        <div className="reward-table-wrap stake-table">
          <table aria-label="Final PROPR allocations" role="table">
            <thead role="rowgroup">
              <tr role="row">
                <th role="columnheader">Rank</th>
                <th role="columnheader">Wallet or vault</th>
                <th role="columnheader">Positions</th>
                <th role="columnheader">Total XBG staked</th>
                <th role="columnheader">Effective stake</th>
                <th role="columnheader">Final PROPR allocation</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {shown.map((row) => (
                <tr key={row.rank} role="row" className={row.you ? 'is-you' : undefined}>
                  <td role="cell" data-label="Rank">#{row.rank}</td>
                  <td role="cell" data-label="Wallet" className="tx-hash">{row.you ? `${row.wallet} (you)` : row.wallet}</td>
                  <td role="cell" data-label="Positions">{row.positions}</td>
                  <td role="cell" data-label="Staked">{formatNumber(row.staked)}</td>
                  <td role="cell" data-label="Effective">{formatNumber(row.effective)}</td>
                  <td role="cell" data-label="PROPR">{proprFormat.format(row.propr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown.length < rows.length ? (
          <button type="button" className="btn btn-secondary" data-step-focus onClick={() => dispatch({ type: 'allocations.more' })}>
            Load more
          </button>
        ) : null}
      </div>
    </ModalShell>
  )
}

export function BuyDialog({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  if (state.modal?.kind !== 'buy') return null
  return (
    <ModalShell title="Get XBG" onClose={() => dispatch({ type: 'modal.close' })} className="stake-modal">
      <div className="stake-step">
        <p className="modal-lead">Buy XBG on one of these venues, then pledge it here. It stays in your wallet.</p>
        <ul className="venue-list">
          {BUY_VENUES.map((venue) => (
            <li key={venue.name}>
              <a href={venue.href} target="_blank" rel="noreferrer">
                <strong>{venue.name}</strong>
                <span>{venue.network}</span>
              </a>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'buy.simulate' })}>
          Add demo XBG to this wallet
        </button>
      </div>
    </ModalShell>
  )
}

export function UnstakeDialog({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  const modal = state.modal
  if (modal?.kind !== 'unstake') return null
  const position = state.positions.find((p) => p.id === modal.positionId)
  if (!position) return null
  return (
    <ModalShell title="Confirm in wallet" onClose={() => dispatch({ type: 'modal.close' })} className="stake-modal">
      <div className="stake-step">
        <DemoWallet
          title="Transaction request"
          approveLabel="Confirm"
          onApprove={() => dispatch({ type: 'unstake.approve' })}
          onReject={() => dispatch({ type: 'unstake.reject' })}
        >
          <dl className="confirmation-list">
            <div><dt>Contract call</dt><dd>unstake(position {position.id})</dd></div>
            <div><dt>Returns to wallet</dt><dd>{formatXbg(position.amount)}</dd></div>
            <div><dt>From</dt><dd className="tx-hash">{DEMO_WALLET.address}</dd></div>
            <div><dt>Network</dt><dd>Arbitrum</dd></div>
          </dl>
        </DemoWallet>
      </div>
    </ModalShell>
  )
}
