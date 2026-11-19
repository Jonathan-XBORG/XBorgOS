import { HISTORY, SEASON, formatXbg, type HistoryRow } from './config'
import type { StakeAction, StakeState } from './demoState'

function rowsFor(state: StakeState): HistoryRow[] {
  // A closed season appears once its rewards are being processed.
  if (state.season === 'closed' && state.pledged > 0) {
    return [{ season: SEASON.number, pledged: state.pledged, reward: null, pool: SEASON.pool, status: 'Processing' }, ...HISTORY]
  }
  return state.positions.length || state.pledged > 0 || state.wallet > 0 ? [...HISTORY] : []
}

export default function HistoryView({ state, dispatch }: { state: StakeState; dispatch: React.Dispatch<StakeAction> }) {
  const rows = rowsFor(state)
  const shown = rows.slice(0, state.historyShown)

  return (
    <div className="portal-page history-page">
      <div className="portal-page-heading">
        <p className="portal-kicker">XBG Rewards</p>
        <h1>Completed seasons</h1>
        <p>Your past XBG pledges and rewards. Paid in XBG at season end, sized by holding and multiplier.</p>
      </div>

      <section className="reward-history" aria-label="Season history">
        {rows.length ? (
          <div className="reward-table-wrap">
            <table aria-label="Completed seasons" role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader">Season</th>
                  <th role="columnheader">Your XBG pledged</th>
                  <th role="columnheader">Your reward</th>
                  <th role="columnheader">Reward pool</th>
                  <th role="columnheader">Status</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {shown.map((row) => (
                  <tr key={row.season} role="row">
                    <td role="cell">Season {row.season}</td>
                    <td role="cell">{row.pledged === null ? 'Not available' : formatXbg(row.pledged)}</td>
                    <td role="cell">{row.reward === null ? 'Not available' : formatXbg(row.reward)}</td>
                    <td role="cell">{formatXbg(row.pool)}</td>
                    <td role="cell">
                      <span className={`status-badge is-${row.status === 'Ineligible' ? 'locked' : row.status === 'Processing' ? 'pending' : 'distributed'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="section-note">This wallet has no completed seasons yet.</p>
        )}
        {shown.length < rows.length ? (
          <button type="button" className="btn btn-secondary history-more" onClick={() => dispatch({ type: 'history.more' })}>
            Load more…
          </button>
        ) : null}
      </section>
    </div>
  )
}
