import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

export type OsWindowOrigin = { x: number; y: number } | null

const MARGIN = 16
const DOCK_SPACE = 128
const FULL_MS = 420
const CASCADE = 40

type Rect = { x: number; y: number; w: number; h: number | null }

function fullRect(): Rect {
  return { x: MARGIN, y: MARGIN, w: window.innerWidth - MARGIN * 2, h: window.innerHeight - MARGIN - DOCK_SPACE }
}

// One chrome for every XBorg OS window: icon, title, full screen and close,
// dragged by its title bar, raised on click. Windows grow out of their dock
// tile (or desktop icon) and shrink back into it, as on macOS.
export default function OsWindow({
  id,
  title,
  icon,
  width,
  height,
  top,
  cascade = 0,
  z,
  front,
  origin,
  className,
  accessory,
  onFocus,
  onClose,
  children,
}: {
  id: string
  title: string
  icon: ReactNode
  width: number
  height?: number
  top?: number
  cascade?: number
  z: number
  front: boolean
  origin: OsWindowOrigin
  className?: string
  accessory?: ReactNode
  onFocus: () => void
  onClose: () => void
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [full, setFull] = useState(false)
  const [animating, setAnimating] = useState(false)
  const restore = useRef<Rect | null>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const timer = useRef(0)

  // First placement: centred horizontally, at the design's height when it fits.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || rect) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxH = vh - DOCK_SPACE - MARGIN
    const h = height ? Math.min(height, maxH) : el.offsetHeight
    const w = Math.min(width, vw - MARGIN * 2)
    const baseX = Math.max(MARGIN, (vw - w) / 2)
    const wanted = top ?? (vh - DOCK_SPACE - h) / 2
    const baseY = Math.max(MARGIN, Math.min(wanted, vh - DOCK_SPACE - h))
    // Each window opened on top of others steps down and right, so the stack
    // stays readable. Near an edge the step goes the other way.
    const step = CASCADE * cascade
    const fitsX = baseX + step + w <= vw - MARGIN
    const fitsY = baseY + step + h <= vh - DOCK_SPACE
    const x = Math.max(MARGIN, fitsX ? baseX + step : baseX - step)
    const y = Math.max(MARGIN, fitsY ? baseY + step : baseY - step)
    setRect({ x, y, w, h: height ? h : null })
  }, [rect, top, width, height, cascade])

  // A new size (Stake growing from its visitor view into the full app) glides
  // to the new centred rect.
  const sized = useRef({ width, height })
  useEffect(() => {
    if (sized.current.width === width && sized.current.height === height) return
    sized.current = { width, height }
    if (!rect || full) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = Math.min(width, vw - MARGIN * 2)
    const h = height ? Math.min(height, vh - DOCK_SPACE - MARGIN) : null
    setAnimating(!reduce)
    setRect({ x: Math.max(MARGIN, (vw - w) / 2), y: Math.max(MARGIN, (vh - DOCK_SPACE - (h ?? 400)) / 2), w, h })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAnimating(false), reduce ? 0 : FULL_MS + 40)
  }, [width, height, rect, full, reduce])

  useEffect(() => {
    if (front) ref.current?.querySelector<HTMLElement>('.os-win-close')?.focus({ preventScroll: true })
  }, [front])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!full) return
    const onResize = () => setRect(fullRect())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [full])

  // Full screen animates left, top, width and height together. Height "auto"
  // can't transition, so the current height is pinned first.
  function toggleFull() {
    const el = ref.current
    if (!el || !rect) return
    window.clearTimeout(timer.current)
    const current: Rect = { ...rect, h: el.offsetHeight }
    if (!full) {
      restore.current = rect
      setRect(current)
      setAnimating(!reduce)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setFull(true)
          setRect(fullRect())
        }),
      )
    } else {
      const back = restore.current ?? current
      const backH = back.h ?? measureAutoHeight(el, back.w)
      setAnimating(!reduce)
      setFull(false)
      setRect({ ...back, h: backH })
      timer.current = window.setTimeout(() => {
        setAnimating(false)
        setRect(back)
      }, reduce ? 0 : FULL_MS)
    }
    if (!reduce && !full) timer.current = window.setTimeout(() => setAnimating(false), FULL_MS + 40)
  }

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    if (full || e.button !== 0 || !rect) return
    if ((e.target as Element).closest('button, a')) return
    drag.current = { dx: e.clientX - rect.x, dy: e.clientY - rect.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const d = drag.current
    if (!d || !rect) return
    const el = ref.current!
    setRect({
      ...rect,
      x: Math.min(window.innerWidth - 80, Math.max(80 - el.offsetWidth, e.clientX - d.dx)),
      y: Math.min(window.innerHeight - 80, Math.max(0, e.clientY - d.dy)),
    })
  }
  function onPointerUp() {
    drag.current = null
  }

  const style: CSSProperties = {
    zIndex: z,
    left: rect?.x ?? 0,
    top: rect?.y ?? 0,
    width: rect?.w ?? width,
    height: rect?.h ?? undefined,
    visibility: rect ? 'visible' : 'hidden',
    // Grow out of the dock tile: scale around the tile's position.
    transformOrigin: origin && rect ? `${origin.x - rect.x}px ${origin.y - rect.y}px` : '50% 100%',
  }

  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.06 }

  return (
    <motion.section
      ref={ref}
      role="dialog"
      aria-label={title}
      data-window={id}
      data-front={front ? 'true' : undefined}
      className={`os-win${full ? ' is-full' : ''}${front ? ' is-front' : ''}${animating ? ' is-animating' : ''}${height ? ' has-height' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      onPointerDownCapture={onFocus}
      initial={hidden}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ ...hidden, transition: { duration: reduce ? 0 : 0.28, ease: [0.5, 0, 0.75, 0] } }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="os-win-bar" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onDoubleClick={toggleFull}>
        <span className="os-win-icon" aria-hidden="true">
          {icon}
        </span>
        <h2 className="os-win-title">{title}</h2>
        {accessory}
        <div className="os-win-controls">
          <button type="button" className="os-win-btn" aria-label={full ? 'Exit full screen' : 'Full screen'} onClick={toggleFull}>
            <img src="/os/fullscreen.svg" alt="" width={24} height={24} />
          </button>
          <button type="button" className="os-win-btn os-win-close" aria-label={`Close ${title}`} onClick={onClose}>
            <img src="/os/close.svg" alt="" width={24} height={24} />
          </button>
        </div>
      </header>
      <div className="os-win-body">{children}</div>
    </motion.section>
  )
}

function measureAutoHeight(el: HTMLElement, w: number) {
  const clone = el.cloneNode(true) as HTMLElement
  clone.style.cssText += `;position:absolute;visibility:hidden;height:auto;width:${w}px;transition:none;transform:none`
  clone.classList.remove('is-full')
  el.parentElement!.appendChild(clone)
  const h = clone.offsetHeight
  clone.remove()
  return h
}
