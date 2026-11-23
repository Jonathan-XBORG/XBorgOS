import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type PointerEvent, type Ref } from 'react'

// A scroll box with our own scrollbar. The native one is hidden, so the bar
// can sit inset from the window edge, fade with the window hover, and be
// dragged with pointer events (which keeps the 3D cursor following).

type Props = HTMLAttributes<HTMLDivElement> & { viewRef?: Ref<HTMLDivElement> }

const INSET = 6
const MIN_THUMB = 28

export default function ScrollArea({ viewRef, className, children, ...rest }: Props) {
  const view = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ y: number; top: number } | null>(null)
  const [thumb, setThumb] = useState({ size: 0, offset: 0, visible: false })
  const [dragging, setDragging] = useState(false)

  const setView = useCallback(
    (el: HTMLDivElement | null) => {
      view.current = el
      if (typeof viewRef === 'function') viewRef(el)
      else if (viewRef) (viewRef as { current: HTMLDivElement | null }).current = el
    },
    [viewRef],
  )

  const measure = useCallback(() => {
    const el = view.current
    if (!el) return
    const { scrollHeight, clientHeight, scrollTop } = el
    const track = clientHeight - INSET * 2
    if (scrollHeight <= clientHeight + 1) {
      setThumb((t) => (t.visible ? { size: 0, offset: 0, visible: false } : t))
      return
    }
    const size = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * track)
    const offset = (scrollTop / (scrollHeight - clientHeight)) * (track - size)
    setThumb({ size, offset, visible: true })
  }, [])

  useEffect(() => {
    const el = view.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const mo = new MutationObserver(measure)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [measure])

  function ratio() {
    const el = view.current!
    const track = el.clientHeight - INSET * 2
    return (el.scrollHeight - el.clientHeight) / Math.max(1, track - thumb.size)
  }

  function onThumbDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    drag.current = { y: e.clientY, top: view.current!.scrollTop }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  function onThumbMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    view.current!.scrollTop = d.top + (e.clientY - d.y) * ratio()
  }
  function onThumbUp() {
    drag.current = null
    setDragging(false)
  }
  // A click on the track jumps there, centred on the pointer.
  function onTrackDown(e: PointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top - thumb.size / 2
    view.current!.scrollTo({ top: y * ratio(), behavior: 'smooth' })
  }

  return (
    <div className={`os-scroll${dragging ? ' is-dragging' : ''}`}>
      <div {...rest} ref={setView} className={`os-scroll-view${className ? ` ${className}` : ''}`} onScroll={measure}>
        {children}
      </div>
      {thumb.visible ? (
        <div className="os-scroll-track" aria-hidden="true" onPointerDown={onTrackDown}>
          <div
            className="os-scroll-thumb"
            style={{ height: thumb.size, transform: `translateY(${thumb.offset}px)` }}
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
          />
        </div>
      ) : null}
    </div>
  )
}
