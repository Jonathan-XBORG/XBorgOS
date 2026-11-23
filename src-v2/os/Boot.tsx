import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

// The start up screen: the XBorg mark and a progress bar while the wallpaper
// and fonts load. It stays at least MIN_MS so it never just flashes, and at
// most MAX_MS so a slow image never holds the visitor back.

const MIN_MS = 1100
const MAX_MS = 4000

function preload(src: string) {
  if (!src) return Promise.resolve()
  const img = new Image()
  img.src = src
  return img.decode().catch(() => {})
}

export default function Boot({ image, onDone }: { image: string; onDone: () => void }) {
  const reduce = useReducedMotion()
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState(0.08)

  useEffect(() => {
    let alive = true
    const start = performance.now()
    const min = reduce ? 300 : MIN_MS
    const ready = Promise.all([preload(image), document.fonts?.ready.catch(() => {})])
    const timeout = new Promise((r) => window.setTimeout(r, MAX_MS))
    // The bar creeps towards 90% and jumps to the end once everything is in.
    const tick = window.setInterval(() => setProgress((p) => p + (0.9 - p) * 0.08), 60)
    Promise.race([ready, timeout]).then(() => {
      const wait = Math.max(0, min - (performance.now() - start))
      window.setTimeout(() => {
        if (!alive) return
        window.clearInterval(tick)
        setProgress(1)
        window.setTimeout(() => alive && setDone(true), reduce ? 0 : 280)
      }, wait)
    })
    return () => {
      alive = false
      window.clearInterval(tick)
    }
  }, [image, reduce])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {done ? null : (
        <motion.div
          className="os-boot"
          role="status"
          aria-label="Loading XBorg OS"
          initial={false}
          exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.5, ease: [0.4, 0, 0.2, 1] } }}
        >
          <motion.svg
            className="os-boot-logo"
            width="64"
            height="67"
            viewBox="0 0 19 20"
            fill="currentColor"
            aria-hidden="true"
            initial={reduce ? false : { opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <path d="M18.54.06c.19-.14.46 0 .46.23V5.1c0 .28-.13.54-.34.7l-4.8 3.67a.83.83 0 0 1-.52.18H5.66a.83.83 0 0 1-.52-.18L.34 5.8A.88.88 0 0 1 0 5.1V.29C0 .05.27-.09.46.06l8.87 6.71c.1.08.24.08.34 0L18.54.06Z" />
            <path d="M18.54 19.94c.19.15.46.01.46-.23V14.9a.88.88 0 0 0-.34-.7l-4.8-3.67a.83.83 0 0 0-.52-.18H5.66a.83.83 0 0 0-.52.18L.34 14.2a.88.88 0 0 0-.34.7v4.81c0 .24.27.38.46.23l8.87-6.71c.1-.08.24-.08.34 0l8.87 6.71Z" />
          </motion.svg>
          <div className="os-boot-bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
