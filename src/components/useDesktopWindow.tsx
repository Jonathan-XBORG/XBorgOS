import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'

// Movable, resizable desktop windows. Size and position are remembered while
// the page stays open and reset on reload. Below 900px windows are sheets.

export type Rect = { x: number; y: number; w: number; h: number }
type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
type Memory = { rect: Rect; restore: Rect | null }

const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
const GAP = 12
const MENU_BAR = 44
const DESKTOP_QUERY = '(min-width: 900px)'
const memory = new Map<string, Memory>()

export type DesktopArea = { top: number; left: number; right: number; bottom: number }

export function desktopArea(): DesktopArea {
  const dock = document.querySelector('.dock-tray')?.getBoundingClientRect()
  const dockTop = dock && dock.height > 0 ? dock.top : window.innerHeight - 108
  return {
    top: MENU_BAR + GAP,
    left: GAP,
    right: window.innerWidth - GAP,
    bottom: dockTop - GAP,
  }
}

function clampRect(rect: Rect, area: DesktopArea, min: { w: number; h: number }): Rect {
  const maxW = area.right - area.left
  const maxH = area.bottom - area.top
  const w = Math.min(Math.max(rect.w, Math.min(min.w, maxW)), maxW)
  const h = Math.min(Math.max(rect.h, Math.min(min.h, maxH)), maxH)
  const x = Math.min(Math.max(rect.x, area.left), area.right - w)
  const y = Math.min(Math.max(rect.y, area.top), area.bottom - h)
  return { x, y, w, h }
}

function fill(area: DesktopArea): Rect {
  return { x: area.left, y: area.top, w: area.right - area.left, h: area.bottom - area.top }
}

function useDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  )
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    const sync = () => setDesktop(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  return desktop
}

export function useDesktopWindow({
  id,
  open,
  min,
  initial,
}: {
  id: string
  open: boolean
  min: { w: number; h: number }
  initial: (area: DesktopArea) => Rect
}) {
  const desktop = useDesktop()
  const [rect, setRect] = useState<Rect | null>(null)
  const [restore, setRestore] = useState<Rect | null>(null)
  const [interacting, setInteracting] = useState(false)
  const frame = useRef<number | null>(null)
  const pending = useRef<Rect | null>(null)

  const schedule = useCallback((next: Rect) => {
    pending.current = next
    if (frame.current !== null) return
    frame.current = window.requestAnimationFrame(() => {
      frame.current = null
      if (pending.current) setRect(pending.current)
    })
  }, [])

  // Place the window before it paints, from memory or its default geometry.
  useLayoutEffect(() => {
    if (!open || !desktop) return
    const area = desktopArea()
    const saved = memory.get(id)
    setRect(clampRect(saved?.rect ?? initial(area), area, min))
    setRestore(saved?.restore ?? null)
    // The initial geometry function is stable per window type.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, desktop, id])

  useEffect(() => {
    if (rect) memory.set(id, { rect, restore })
  }, [id, rect, restore])

  // Keep the window inside the desktop when the viewport changes.
  useEffect(() => {
    if (!open || !desktop) return
    const onResize = () => {
      const area = desktopArea()
      setRect((current) => {
        if (!current) return current
        return restore ? fill(area) : clampRect(current, area, min)
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, desktop, restore, min])

  useEffect(() => () => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current)
  }, [])

  const maximised = Boolean(restore)

  const toggleMaximise = useCallback(() => {
    if (!rect) return
    const area = desktopArea()
    if (restore) {
      setRect(clampRect(restore, area, min))
      setRestore(null)
    } else {
      setRestore(rect)
      setRect(fill(area))
    }
  }, [rect, restore, min])

  function track(
    event: PointerEvent<HTMLElement>,
    move: (dx: number, dy: number, start: Rect, area: DesktopArea) => Rect,
    before?: (start: Rect) => Rect,
  ) {
    if (!rect || event.button !== 0) return
    event.preventDefault()
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const area = desktopArea()
    const origin = { x: event.clientX, y: event.clientY }
    let start: Rect | null = null
    // Nothing changes until the pointer travels a few pixels, so a click or
    // the first half of a double click never moves or restores the window.
    const onMove = (next: globalThis.PointerEvent) => {
      const dx = next.clientX - origin.x
      const dy = next.clientY - origin.y
      if (!start) {
        if (Math.hypot(dx, dy) < 3) return
        start = before ? before(rect) : rect
        setInteracting(true)
      }
      schedule(move(dx, dy, start, area))
    }
    const onUp = () => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
      setInteracting(false)
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  function onTitlePointerDown(event: PointerEvent<HTMLElement>) {
    if (!desktop || (event.target as HTMLElement).closest('button')) return
    track(
      event,
      (dx, dy, start, area) => clampRect({ ...start, x: start.x + dx, y: start.y + dy }, area, min),
      (start) => {
        if (!restore) return start
        // Dragging a maximised window restores its size under the pointer.
        const ratio = (event.clientX - start.x) / start.w
        const next = { ...restore, x: event.clientX - restore.w * ratio, y: start.y }
        setRestore(null)
        return next
      },
    )
  }

  function onTitleDoubleClick(event: MouseEvent<HTMLElement>) {
    if (!desktop || (event.target as HTMLElement).closest('button')) return
    toggleMaximise()
  }

  function onEdgePointerDown(edge: Edge) {
    return (event: PointerEvent<HTMLElement>) => {
      track(event, (dx, dy, start, area) => {
        let { x, y, w, h } = start
        if (edge.includes('e')) w = Math.min(Math.max(start.w + dx, min.w), area.right - start.x)
        if (edge.includes('s')) h = Math.min(Math.max(start.h + dy, min.h), area.bottom - start.y)
        if (edge.includes('w')) {
          const right = start.x + start.w
          x = Math.min(Math.max(start.x + dx, area.left), right - min.w)
          w = right - x
        }
        if (edge.includes('n')) {
          const bottom = start.y + start.h
          y = Math.min(Math.max(start.y + dy, area.top), bottom - min.h)
          h = bottom - y
        }
        return { x, y, w, h }
      }, (start) => {
        if (restore) setRestore(null)
        return start
      })
    }
  }

  const active = desktop && open && rect !== null
  const style: CSSProperties | undefined = active
    ? { left: rect.x, top: rect.y, width: rect.w, height: rect.h, margin: 0 }
    : undefined

  const handles: ReactNode = active
    ? EDGES.map((edge) => (
        <span
          key={edge}
          className={`window-resize is-${edge}`}
          data-edge={edge}
          aria-hidden="true"
          onPointerDown={onEdgePointerDown(edge)}
        />
      ))
    : null

  return {
    desktop,
    rect: active ? rect : null,
    style,
    handles,
    maximised: active && maximised,
    interacting,
    toggleMaximise,
    titleBarProps: active ? { onPointerDown: onTitlePointerDown, onDoubleClick: onTitleDoubleClick } : {},
  }
}
