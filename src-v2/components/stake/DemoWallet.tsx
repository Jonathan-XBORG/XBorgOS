import type { ReactNode } from 'react'

// Stands in for the wallet extension. Nothing is signed or sent: the buttons
// only move the demo forward, so the flow can be reviewed without a wallet.
export default function DemoWallet({
  title,
  children,
  approveLabel,
  onApprove,
  onReject,
}: {
  title: string
  children: ReactNode
  approveLabel: string
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <section className="demo-wallet" aria-label={`Demo wallet: ${title}`}>
      <div className="demo-wallet-head">
        <span className="demo-badge">Demo wallet</span>
        <strong>{title}</strong>
      </div>
      <div className="demo-wallet-body">{children}</div>
      <div className="demo-wallet-actions">
        <button type="button" className="btn btn-secondary" onClick={onReject}>
          Reject
        </button>
        <button type="button" className="btn btn-primary" data-step-focus onClick={onApprove}>
          {approveLabel}
        </button>
      </div>
    </section>
  )
}

export function SignedMessage({ lines }: { lines: string[] }) {
  return <pre className="demo-wallet-message">{lines.join('\n')}</pre>
}
