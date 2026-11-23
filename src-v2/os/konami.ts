import { useEffect, useRef } from 'react'

// ↑ ↑ ↓ ↓ ← → ← → B A. On a keyboard it is typed; on a touch screen it is
// swiped (up, up, down, down, left, right, left, right) then tapped twice.

const KEYS = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const TOUCH = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'tap', 'tap']

export function useKonami(onCode: () => void) {
  const cb = useRef(onCode)
  cb.current = onCode

  useEffect(() => {
    let keys: string[] = []
    let moves: string[] = []
    let start: { x: number; y: number; t: number } | null = null

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      keys = [...keys, key].slice(-KEYS.length)
      if (keys.join() === KEYS.join()) {
        keys = []
        cb.current()
      }
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      start = { x: e.clientX, y: e.clientY, t: performance.now() }
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || !start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const quick = performance.now() - start.t < 600
      start = null
      let move: string | null = null
      if (Math.hypot(dx, dy) < 12 && quick) move = 'tap'
      else if (Math.abs(dx) > 40 || Math.abs(dy) > 40) move = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      if (!move) return
      moves = [...moves, move].slice(-TOUCH.length)
      if (moves.join() === TOUCH.join()) {
        moves = []
        cb.current()
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])
}
