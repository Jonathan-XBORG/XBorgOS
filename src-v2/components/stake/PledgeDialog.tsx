import { IconCheck } from '../Icons'
import { DEMO_WALLET, SEASON, formatMultiplier, formatXbg } from './config'
import DemoWallet, { SignedMessage } from './DemoWallet'
import {
  availableToPledge,
  currentEstimate,
  parseAmount,
  stakeMultiplier,
  stakedTotal,
  type StakeAction,
  type StakeState,
} from './demoState'
import ModalShell from './ModalShell'

export default function PledgeDialog({
  state,
  dispatch,
}: {
  state: StakeState
  dispatch: React.Dispatch<StakeAction>
}) {
  if (state.modal?.kind !== 'pledge') return null
  const modal = state.modal
  const amount = parseAmount(modal.amountText)
  const shownAmount = Number.isFinite(amount) ? formatXbg(amount) : '0 XBG'
  const multiplier = stakeMultiplier(state)
  const eligible = state.eligibility === 'eligible'
  const canSubmit = state.season === 'open'
  const busy = modal.phase === 'signing' || modal.phase === 'submitting'
  const title =
    modal.result === 'done'
      ? 'XBG pledged successfully'
      : state.pledged > 0 && modal.result === null
        ? 'Pledge more XBG'
        : 'Pledge XBG'

  return (
    <ModalShell
      title={title}
      onClose={() => dispatch({ type: 'modal.close' })}
      className="stake-modal pledge-modal"
      focusKey={`${modal.step}:${modal.phase}:${modal.result ?? ''}`}
      closeDisabled={modal.phase === 'submitting'}
    >
      {modal.step === 'amount' ? (
        <form
          className="stake-step"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            dispatch({ type: 'pledge.next' })
          }}
        >
          <p className="modal-lead">
            Your XBG never leaves your wallet. Pledging sets the minimum balance you commit to keep there for the
            season. XBG you have staked counts towards your pledge too.
          </p>
          <label htmlFor="pledge-amount">Amount to pledge</label>
          <div className={`amount-field${modal.error ? ' is-error' : ''}`}>
            <input
              id="pledge-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={modal.amountText}
              aria-invalid={modal.error || undefined}
              aria-describedby={modal.error ? 'pledge-amount-error pledge-available' : 'pledge-available'}
              data-step-focus
              onChange={(event) => dispatch({ type: 'pledge.amount', text: event.target.value })}
            />
            <span>XBG</span>
            <button type="button" className="amount-max" onClick={() => dispatch({ type: 'pledge.max' })}>
              MAX
            </button>
          </div>
          <p className="field-meta" id="pledge-available">
            Available: {formatXbg(availableToPledge(state))}, including {formatXbg(stakedTotal(state))} currently staked.
          </p>
          {modal.error ? (
            <p className="form-error" id="pledge-amount-error" role="alert">
              Enter an amount up to your available XBG balance.
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary">
            Next
          </button>
        </form>
      ) : null}

      {modal.step === 'confirm' ? (
        <div className="stake-step">
          <dl className="confirmation-list">
            <div><dt>Amount</dt><dd>{shownAmount}</dd></div>
            <div><dt>Season</dt><dd>{SEASON.number}</dd></div>
            <div><dt>Multiplier</dt><dd>{formatMultiplier(multiplier)}</dd></div>
            {eligible ? (
              <div>
                <dt>Estimated reward</dt>
                <dd>~{formatXbg(currentEstimate(state, Number.isFinite(amount) ? amount : 0))}</dd>
              </div>
            ) : null}
          </dl>
          {eligible ? (
            <p className="field-meta">
              Includes your {formatMultiplier(multiplier)} multiplier. Your share falls as more XBG is pledged, so this moves
              during the season.
            </p>
          ) : (
            <p className="field-meta">
              This wallet is not eligible yet, so the pledge will not earn until you complete a requirement.
            </p>
          )}

          {modal.phase === 'rejected' ? (
            <p className="form-error" role="alert">
              You cancelled the signature, so nothing was pledged. Your XBG is untouched and you can pledge whenever you
              are ready.
            </p>
          ) : null}

          {modal.phase === 'submitting' ? (
            <div className="pending-box" role="status">
              <span className="pending-spinner" aria-hidden="true" />
              <div>
                <strong>Pledging {shownAmount}…</strong>
                <span>Confirming with the rewards service. Do not close this window.</span>
              </div>
            </div>
          ) : null}

          {modal.phase === 'signing' ? (
            <>
              <div className="pending-box" role="status">
                <span className="pending-spinner" aria-hidden="true" />
                <div>
                  <strong>Confirm in your wallet</strong>
                  <span>
                    Approve the signature request to pledge {shownAmount} for Season {SEASON.number}. Signing is free and
                    never moves your XBG.
                  </span>
                </div>
              </div>
              <DemoWallet
                title="Signature request"
                approveLabel="Sign"
                onApprove={() => dispatch({ type: 'pledge.approve' })}
                onReject={() => dispatch({ type: 'pledge.reject' })}
              >
                <SignedMessage
                  lines={[
                    'XBorg Pledge XBG',
                    '',
                    `Wallet: ${DEMO_WALLET.full}`,
                    `Amount: ${Number.isFinite(amount) ? amount : 0} XBG`,
                    `Season: ${SEASON.number}`,
                    'Issued At: 2026-10-17T09:30:00.000Z',
                    'Version: 1',
                    '',
                    'Signing is free and does not move your tokens. It confirms the amount you are committing to keep in your wallet.',
                  ]}
                />
              </DemoWallet>
            </>
          ) : null}

          {modal.phase === 'idle' || modal.phase === 'rejected' ? (
            canSubmit ? (
              <p className="field-meta">You’ll be asked to sign a message. Signing is free and nothing leaves your wallet.</p>
            ) : (
              <p className="field-meta">You’ll be able to complete your pledge here when signing goes live.</p>
            )
          ) : null}

          <div className="dialog-actions">
            <button type="button" className="btn btn-quiet" onClick={() => dispatch({ type: 'pledge.back' })} disabled={busy}>
              Back
            </button>
            {!canSubmit ? (
              <button type="button" className="btn btn-primary" disabled>
                Pledging opens soon
              </button>
            ) : modal.phase === 'signing' ? (
              <button type="button" className="btn btn-primary is-pending" disabled aria-busy="true">
                Waiting for your wallet…
              </button>
            ) : modal.phase === 'submitting' ? (
              <button type="button" className="btn btn-primary is-pending" disabled aria-busy="true">
                Pledging…
              </button>
            ) : (
              <button type="button" className="btn btn-primary" data-step-focus onClick={() => dispatch({ type: 'pledge.sign' })}>
                {modal.phase === 'rejected' ? 'Sign again' : 'Sign'}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {modal.step === 'result' && modal.result === 'done' ? (
        <div className="stake-step stake-complete">
          <span className="confirmation-mark" aria-hidden="true">
            <IconCheck />
          </span>
          <p className="modal-lead">
            <strong>{formatXbg(state.pledged)} pledged for Season {SEASON.number}.</strong> Your XBG stay in your wallet. Keep
            at least this balance until the season ends to stay eligible.
          </p>
          <button type="button" className="btn btn-primary" data-step-focus onClick={() => dispatch({ type: 'modal.close' })}>
            Done
          </button>
        </div>
      ) : null}

      {modal.step === 'result' && modal.result === 'lost' ? (
        <div className="stake-step">
          <div className="notice-box is-warning" role="alert">
            <strong>We lost contact before confirming.</strong>
            <span>Your pledge may or may not have gone through. Refresh this page to check before trying again.</span>
          </div>
          <button type="button" className="btn btn-primary" data-step-focus onClick={() => dispatch({ type: 'pledge.refresh' })}>
            Refresh and check
          </button>
        </div>
      ) : null}

      {modal.step === 'result' && modal.result === 'refused' ? (
        <div className="stake-step">
          <div className="notice-box is-error" role="alert">
            <strong>Nothing was pledged.</strong>
            <span>That is more than your available XBG. Your balance may have changed, so close this and try again.</span>
          </div>
          <button type="button" className="btn btn-primary" data-step-focus onClick={() => dispatch({ type: 'modal.close' })}>
            Close
          </button>
        </div>
      ) : null}
    </ModalShell>
  )
}

