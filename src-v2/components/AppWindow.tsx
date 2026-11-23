import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useDesktopWindow, type DesktopArea, type Rect } from './useDesktopWindow'
import WindowControls from './WindowControls'

const ease = [0.2, 0.7, 0.2, 1] as const
const FOCUSABLE = 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'

export type WindowOrigin = { x: number; y: number }

// A window opening at its default size keeps at least 24px from the menu bar and
// the dock, as round 5 set. Maximise still fills the whole desktop area.
const OPENING_CLEARANCE = 12

export function centred(width: number, height: number) {
  return (area: DesktopArea): Rect => {
    const w = Math.min(width, area.right - area.left)
    const h = Math.min(height, area.bottom - area.top - OPENING_CLEARANCE * 2)
    return {
      x: area.left + (area.right - area.left - w) / 2,
      y: area.top + (area.bottom - area.top - h) / 2,
      w,
      h,
    }
  }
}

// One chrome for every product and Portal window: title, maximise, close,
// focus trap, Escape to close, and scale from the dock tile.
export default function AppWindow({
  id,
  open,
  title,
  className,
  min,
  initial,
  origin,
  onClose,
  dialogRef: externalRef,
  accessory,
  children,
}: {
  id: string
  open: boolean
  title: string
  className: string
  min: { w: number; h: number }
  initial: (area: DesktopArea) => Rect
  origin: WindowOrigin | null
  onClose: () => void
  dialogRef?: RefObject<HTMLElement | null>
  accessory?: ReactNode
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const closeRef = useRef<HTMLButtonElement>(null)
  const localRef = useRef<HTMLElement>(null)
  const dialogRef = externalRef ?? localRef
  const onCloseRef = useRef(onClose)
  const win = useDesktopWindow({ id, open, min, initial })
  // Geometry changes animate only once the window has been placed, so the first
  // placement never slides in from somewhere else.
  const [placed, setPlaced] = useState(false)

  useEffect(() => {
    if (!open) {
      setPlaced(false)
      return
    }
    let second = 0
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setPlaced(true))
    })
    return () => {
      window.cancelAnimationFrame(first)
      window.cancelAnimationFrame(second)
    }
  }, [open])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const nodes = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => !node.hasAttribute('disabled') && node.getClientRects().length > 0,
      )
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    // The menu bar stays usable above open windows, as on a desktop.
    const onFocus = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof Element) || dialogRef.current?.contains(target)) return
      if (target.closest('.topbar')) return
      closeRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('focusin', onFocus)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', onFocus)
    }
  }, [open, dialogRef])

  const transformOrigin = !origin
    ? '50% 100%'
    : win.rect
      ? `${origin.x - win.rect.x}px ${origin.y - win.rect.y}px`
      : `${origin.x}px ${origin.y}px`

  const classes = [
    'window',
    className,
    win.interacting ? 'is-interacting' : '',
    placed ? 'is-placed' : '',
    win.maximised ? 'is-maximised' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AnimatePresence>
      {open ? (
        <motion.section
          ref={dialogRef}
          className={classes}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={{ ...win.style, transformOrigin }}
          initial={reduce ? false : { opacity: 0, transform: 'scale(0.94)' }}
          animate={{ opacity: 1, transform: 'scale(1)' }}
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.2, ease } }
          }
          transition={{ duration: reduce ? 0 : 0.26, ease }}
        >
          <div className="window-frame">
            <div className="window-title" {...win.titleBarProps}>
              {accessory ? <span className="window-accessory">{accessory}</span> : null}
              <span className="window-name">{title}</span>
              <WindowControls
                onClose={onClose}
                closeRef={closeRef}
                onMaximise={win.desktop ? win.toggleMaximise : undefined}
                maximised={win.maximised}
              />
            </div>
            {children}
          </div>
          {win.handles}
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}
