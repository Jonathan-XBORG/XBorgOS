import { useEffect, useRef, type ReactNode } from 'react'

export default function ModalShell({
  title,
  onClose,
  children,
  className = '',
  focusKey,
  closeDisabled = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
  focusKey?: string
  // While a request is in flight the dialog cannot be dismissed.
  closeDisabled?: boolean
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const previousFocusKey = useRef(focusKey)

  useEffect(() => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const portal = backdropRef.current?.closest('.portal-app')
    const background = portal
      ? [...portal.children].filter((child): child is HTMLElement =>
          child instanceof HTMLElement &&
          child !== backdropRef.current &&
          !child.classList.contains('portal-live-region'),
        )
      : []
    const previous = background.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    }))
    // Focus starts on the step's own field or action when it has one, otherwise on Close.
    const first =
      dialogRef.current?.querySelector<HTMLElement>('[data-step-focus]:not(:disabled)') ??
      dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')
    first?.focus()
    background.forEach((element) => {
      element.inert = true
      element.setAttribute('aria-hidden', 'true')
    })
    return () => {
      previous.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert
        if (ariaHidden === null) element.removeAttribute('aria-hidden')
        else element.setAttribute('aria-hidden', ariaHidden)
      })
      returnFocus?.focus()
    }
  }, [])

  useEffect(() => {
    if (previousFocusKey.current === focusKey) return
    previousFocusKey.current = focusKey
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('[data-step-focus]')?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusKey])

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      if (!closeDisabled) onClose()
      return
    }
    if (event.key !== 'Tab' || !dialogRef.current) return
    const controls = [...dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((control) => control.getClientRects().length > 0)
    if (!controls.length) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div ref={backdropRef} className="portal-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && !closeDisabled && onClose()}>
      <section
        ref={dialogRef}
        className={`portal-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-modal-title"
        onKeyDown={handleKeyDown}
      >
        <header className="portal-modal-header">
          <h2 id="portal-modal-title">{title}</h2>
          <button type="button" className="portal-icon-button" onClick={onClose} aria-label="Close" data-autofocus disabled={closeDisabled}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </header>
        <div className="portal-modal-body">{children}</div>
      </section>
    </div>
  )
}
