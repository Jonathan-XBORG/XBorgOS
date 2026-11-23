import type { Ref } from 'react'

// XBorg window controls: maximise and close, on the right of the title bar.
export default function WindowControls({
  onClose,
  closeRef,
  onMaximise,
  maximised = false,
}: {
  onClose?: () => void
  closeRef?: Ref<HTMLButtonElement>
  onMaximise?: () => void
  maximised?: boolean
}) {
  return (
    <span className="window-controls" aria-hidden={onClose ? undefined : 'true'}>
      {onMaximise ? (
        <button
          type="button"
          className="window-control-hit window-maximise"
          aria-label={maximised ? 'Restore' : 'Maximise'}
          aria-pressed={maximised}
          onClick={onMaximise}
        >
          <span className={`window-control is-tertiary${maximised ? ' is-restore' : ''}`} aria-hidden="true" />
        </button>
      ) : null}
      {onClose ? (
        <button
          ref={closeRef}
          type="button"
          className="window-control-hit window-close"
          aria-label="Close"
          onClick={onClose}
        >
          <span className="window-control is-close" aria-hidden="true" />
        </button>
      ) : (
        <span className="window-control is-close" />
      )}
    </span>
  )
}
