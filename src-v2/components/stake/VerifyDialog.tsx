import { IconCheck } from '../Icons'
import { DEMO_WALLET } from './config'
import DemoWallet, { SignedMessage } from './DemoWallet'
import type { StakeAction, StakeState } from './demoState'
import ModalShell from './ModalShell'

export default function VerifyDialog({
  state,
  dispatch,
}: {
  state: StakeState
  dispatch: React.Dispatch<StakeAction>
}) {
  if (state.modal?.kind !== 'verify') return null
  const modal = state.modal

  return (
    <ModalShell
      title="Verify your wallet"
      onClose={() => dispatch({ type: 'modal.close' })}
      className="stake-modal verify-modal"
      focusKey={`${modal.step}:${modal.phase}`}
    >
      {modal.step === 'email' ? (
        <form
          className="stake-step"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            dispatch({ type: 'verify.next' })
          }}
        >
          <p className="modal-lead">Enter the email you use on PROPR or FanBase.</p>
          <label htmlFor="verify-email">Email</label>
          <input
            id="verify-email"
            className={`text-field${modal.error ? ' is-error' : ''}`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={modal.email}
            aria-invalid={modal.error || undefined}
            aria-describedby={modal.error ? 'verify-email-error verify-email-meta' : 'verify-email-meta'}
            data-step-focus
            onChange={(event) => dispatch({ type: 'verify.email', text: event.target.value })}
          />
          <p className="field-meta" id="verify-email-meta">One email per wallet. This can only be changed by support.</p>
          {modal.error ? (
            <p className="form-error" id="verify-email-error" role="alert">
              Enter a valid email address.
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary">
            Next
          </button>
        </form>
      ) : null}

      {modal.step === 'sign' ? (
        <div className="stake-step">
          <dl className="confirmation-list">
            <div><dt>Email</dt><dd>{modal.email}</dd></div>
            <div><dt>Wallet</dt><dd className="tx-hash">{DEMO_WALLET.address}</dd></div>
          </dl>
          <p className="field-meta">You’ll be asked to sign a message. Signing is free and proves you own this wallet.</p>

          {modal.phase === 'rejected' ? (
            <p className="form-error" role="alert">
              You cancelled the signature. Nothing was linked. Sign again whenever you are ready.
            </p>
          ) : null}

          {modal.phase === 'refused' ? (
            <div className="notice-box is-error" role="alert">
              <strong>This email can’t be linked to this wallet.</strong>
              <span>Contact our support on Discord.</span>
            </div>
          ) : null}

          {modal.phase === 'signing' ? (
            <DemoWallet
              title="Signature request"
              approveLabel="Sign"
              onApprove={() => dispatch({ type: 'verify.approve' })}
              onReject={() => dispatch({ type: 'verify.reject' })}
            >
              <SignedMessage
                lines={[
                  'XBorg: link email to wallet',
                  '',
                  `Wallet: ${DEMO_WALLET.full}`,
                  `Email: ${modal.email}`,
                  'Issued At: 2026-10-17T09:30:00.000Z',
                  'Version: 1',
                  '',
                  'Signing proves you control this wallet. It does not prove you control this email address.',
                ]}
              />
            </DemoWallet>
          ) : null}

          {modal.phase === 'refused' ? (
            <button type="button" className="btn btn-primary" disabled>
              Verification refused
            </button>
          ) : modal.phase === 'signing' ? (
            <button type="button" className="btn btn-primary is-pending" disabled aria-busy="true">
              Waiting for signature…
            </button>
          ) : (
            <button type="button" className="btn btn-primary" data-step-focus onClick={() => dispatch({ type: 'verify.sign' })}>
              {modal.phase === 'rejected' ? 'Try again' : 'Sign'}
            </button>
          )}
        </div>
      ) : null}

      {modal.step === 'done' ? (
        <div className="stake-step stake-complete">
          <span className="confirmation-mark" aria-hidden="true">
            <IconCheck />
          </span>
          <p className="modal-lead">
            <strong>Email linked to your wallet.</strong> This is a one time step. You will not be asked again.
          </p>
          <p className="field-meta">
            It does not by itself make you eligible. Your status for the season is shown at the top of the page, and
            updates on its own.
          </p>
          <button type="button" className="btn btn-primary" data-step-focus onClick={() => dispatch({ type: 'modal.close' })}>
            Done
          </button>
        </div>
      ) : null}
    </ModalShell>
  )
}
