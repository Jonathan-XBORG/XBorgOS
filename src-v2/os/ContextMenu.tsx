import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'

// Right click menus for the desktop, icons and the XBG widget. Frosted glass
// like the windows, shortcuts in Geist Mono on the right, sub menus on hover
// or with the arrow keys, flipped away from the screen edges, Escape closes.

export type MenuItem =
  | {
      type?: 'item'
      label: string
      shortcut?: string
      checked?: boolean
      disabled?: boolean
      onSelect?: () => void
      submenu?: MenuItem[]
    }
  | { type: 'separator' }

type Item = Extract<MenuItem, { label: string }>

const EDGE = 8
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

// "⌘I" on a Mac, "Ctrl I" elsewhere; "⇧⌘." → "Ctrl Shift .".
export function shortcut(keys: string) {
  if (isMac) return keys
  return keys.replace('⇧⌘', 'Ctrl Shift ').replace('⌘', 'Ctrl ').replace('⇧', 'Shift ')
}

const selectable = (items: MenuItem[]) =>
  items.map((it, i) => (it.type !== 'separator' && !it.disabled ? i : -1)).filter((i) => i >= 0)

function Menu({
  items,
  x,
  y,
  flipFrom,
  depth,
  autoFocus,
  onDone,
  onBack,
}: {
  items: MenuItem[]
  x: number
  y: number
  // For a sub menu: the left edge of its parent, to open on that side instead.
  flipFrom?: number
  depth: number
  autoFocus: boolean
  onDone: () => void
  onBack?: () => void
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y, ready: false })
  const [active, setActive] = useState(autoFocus ? (selectable(items)[0] ?? -1) : -1)
  const [open, setOpen] = useState<{ index: number; x: number; y: number; flip: number; focus: boolean } | null>(null)
  const rows = useRef<(HTMLDivElement | null)[]>([])

  // Keep the menu on screen: flip left or up when it would overflow.
  useLayoutEffect(() => {
    const el = ref.current!
    const { width, height } = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let nx = x
    let ny = y
    if (nx + width > vw - EDGE) nx = flipFrom !== undefined ? flipFrom - width + 4 : x - width
    if (ny + height > vh - EDGE) ny = depth ? vh - EDGE - height : y - height
    setPos({ x: Math.max(EDGE, nx), y: Math.max(EDGE, ny), ready: true })
  }, [x, y, flipFrom, depth])

  // Focus once placed: a hidden element can't take focus.
  useEffect(() => {
    if (autoFocus && pos.ready) ref.current?.focus({ preventScroll: true })
  }, [autoFocus, pos.ready])

  function openSub(index: number, focus: boolean) {
    const row = rows.current[index]
    const item = items[index] as Item
    if (!row || !item.submenu) return
    const r = row.getBoundingClientRect()
    const menu = ref.current!.getBoundingClientRect()
    setOpen({ index, x: menu.right - 4, y: r.top - 6, flip: menu.left, focus })
  }

  function choose(index: number) {
    const item = items[index]
    if (!item || item.type === 'separator' || item.disabled) return
    if (item.submenu) {
      openSub(index, true)
      return
    }
    onDone()
    item.onSelect?.()
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const list = selectable(items)
    const at = list.indexOf(active)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = e.key === 'ArrowDown' ? list[(at + 1) % list.length] : list[(at - 1 + list.length) % list.length]
      setActive(next ?? -1)
      setOpen(null)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (active >= 0) choose(active)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (active >= 0 && (items[active] as Item).submenu) openSub(active, true)
    } else if (e.key === 'ArrowLeft' && onBack) {
      e.preventDefault()
      onBack()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (onBack) onBack()
      else onDone()
    } else if (e.key === 'Tab') {
      e.preventDefault()
    } else if (e.key.length === 1) {
      // Shortcut letters (⌘C, ⌘I...) and first letters both work here.
      const key = e.key.toLowerCase()
      const byShortcut = list.find((i) => (items[i] as Item).shortcut?.toLowerCase().endsWith(key))
      const byLetter = list.find((i) => (items[i] as Item).label.toLowerCase().startsWith(key))
      const hit = (e.metaKey || e.ctrlKey ? byShortcut : byLetter) ?? byShortcut
      if (hit !== undefined) {
        e.preventDefault()
        setActive(hit)
        choose(hit)
      }
    }
  }

  return (
    <>
      <motion.div
        ref={ref}
        className="os-ctx"
        role="menu"
        tabIndex={-1}
        aria-orientation="vertical"
        style={{ left: pos.x, top: pos.y, visibility: pos.ready ? 'visible' : 'hidden', zIndex: 900 + depth }}
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((item, i) =>
          item.type === 'separator' ? (
            <div key={`sep-${i}`} className="os-ctx-sep" role="separator" />
          ) : (
            <div
              key={item.label}
              ref={(el) => {
                rows.current[i] = el
              }}
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              aria-haspopup={item.submenu ? 'menu' : undefined}
              aria-expanded={item.submenu ? open?.index === i : undefined}
              className={`os-ctx-item${active === i ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}`}
              onPointerEnter={() => {
                if (item.disabled) return
                setActive(i)
                if (item.submenu) openSub(i, false)
                else setOpen(null)
              }}
              onClick={() => choose(i)}
            >
              <span className="os-ctx-check" aria-hidden="true">
                {item.checked ? '✓' : ''}
              </span>
              <span className="os-ctx-label">{item.label}</span>
              {item.shortcut ? <span className="os-ctx-key">{shortcut(item.shortcut)}</span> : null}
              {item.submenu ? (
                <svg className="os-ctx-more" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M3.5 1.5 7 5 3.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
          ),
        )}
      </motion.div>
      {open ? (
        <Menu
          key={open.index}
          items={(items[open.index] as Item).submenu!}
          x={open.x}
          y={open.y}
          flipFrom={open.flip}
          depth={depth + 1}
          autoFocus={open.focus}
          onDone={onDone}
          onBack={() => {
            setOpen(null)
            ref.current?.focus()
          }}
        />
      ) : null}
    </>
  )
}

export default function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    const close = () => onClose()
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('blur', close)
      // Focus is not handed back to what was under the pointer: after a mouse
      // right click that would draw a keyboard focus ring on it.
    }
  }, [onClose])

  return (
    <div ref={root} className="os-ctx-root">
      <Menu items={items} x={x} y={y} depth={0} autoFocus onDone={onClose} />
    </div>
  )
}
