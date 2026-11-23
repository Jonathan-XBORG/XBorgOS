import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'

export type DesktopItemKind = 'docs' | 'changelog' | 'readme' | 'secret'

type Sheet = { src: string; left: number; top: number; w: number; h: number; rotate: number; card?: boolean }

// Paper sheets peeking out of each folder, placed as in the Figma file.
const SHEETS: Record<'docs' | 'changelog', Sheet[]> = {
  docs: [
    // Clients: three logo cards, as in the Figma file.
    { src: '/V2/os/client-card-1.svg', left: 8, top: 7, w: 54.614, h: 54.614, rotate: -8.57, card: true },
    { src: '/V2/os/client-card-2.svg', left: 55, top: -8, w: 55.916, h: 55.916, rotate: 10.46, card: true },
    { src: '/V2/os/client-card-3.svg', left: 99, top: -1, w: 62.985, h: 62.985, rotate: 23.1, card: true },
  ],
  changelog: [
    { src: '/V2/os/changelog-sheet-1.svg', left: 76, top: -4, w: 61.55, h: 75.066, rotate: 12.93 },
    { src: '/V2/os/changelog-sheet-2.svg', left: 37.39, top: -10, w: 55.688, h: 71.359, rotate: -7 },
  ],
}

const DRAG_THRESHOLD = 4

export default function DesktopIcon({
  kind,
  label,
  position,
  selected,
  onSelect,
  onOpen,
  onMove,
  onBlur,
}: {
  kind: DesktopItemKind
  label: string
  position: CSSProperties
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onMove: (dx: number, dy: number) => void
  onBlur: () => void
}) {
  const start = useRef<{ x: number; y: number; moved: boolean; t: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, moved: false, t: performance.now() }
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect()
  }
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    s.moved = true
    setDragging(true)
    setOffset({ x: dx, y: dy })
  }
  function onPointerUp(e: PointerEvent<HTMLButtonElement>) {
    const s = start.current
    start.current = null
    if (!s) return
    if (s.moved) {
      onMove(e.clientX - s.x, e.clientY - s.y)
      setOffset({ x: 0, y: 0 })
      setDragging(false)
    } else if (e.pointerType === 'touch' && performance.now() - s.t < 450) {
      // A long press opens the context menu instead (see Desktop).
      onOpen()
    }
  }
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <button
      type="button"
      className={`os-icon${selected ? ' is-selected' : ''}${dragging ? ' is-dragging' : ''}${kind === 'secret' ? ' is-hidden-file' : ''}`}
      style={{ ...position, transform: `translate(${offset.x}px, ${offset.y}px)` }}
      aria-label={`Open ${label}`}
      data-desktop-item={kind}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null
        setDragging(false)
        setOffset({ x: 0, y: 0 })
      }}
      onDoubleClick={onOpen}
      onKeyDown={onKeyDown}
      // Keyboard focus selects the icon, like Tab on a real desktop.
      onFocus={onSelect}
      onBlur={onBlur}
    >
      {kind === 'readme' || kind === 'secret' ? (
        <span className="os-file" aria-hidden="true">
          <span className="os-sheet-paper">
            <img src="/V2/os/readme-file.svg" alt="" width={64} height={82} draggable={false} />
          </span>
        </span>
      ) : (
        <span className="os-folder" aria-hidden="true">
          <span className="os-folder-back" />
          {SHEETS[kind].map((s) => (
            <span
              key={s.src}
              className="os-folder-sheet"
              style={{ left: s.left, top: s.top, width: s.w, height: s.h, ['--r' as string]: `${s.rotate}deg` }}
            >
              <span className={`os-sheet-paper${s.card ? ' is-card' : ''}`}>
                <img src={s.src} alt="" width={s.card ? 48 : 64} height={s.card ? 48 : 82} draggable={false} />
              </span>
            </span>
          ))}
          <span className="os-folder-blur" />
          <img className="os-folder-front" src="/V2/os/folder-front.svg" alt="" draggable={false} />
        </span>
      )}
      <span className="os-icon-label">{label}</span>
    </button>
  )
}
