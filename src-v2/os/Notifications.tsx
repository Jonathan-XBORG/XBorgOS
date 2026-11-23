import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react'
import { useEffect, useState } from 'react'
import type { ProductId } from '../screens'
import { OS_NOTIFICATIONS, osProduct, type OsNotification } from './data'

const FIRST_DELAY = 700
const STAGGER = 900
const SWIPE_DISTANCE = 90
const SWIPE_VELOCITY = 500

// Notifications arrive one after another in the top left corner. Each one can
// be dismissed with the cross that shows on hover, or by swiping it left.
export default function Notifications({ onOpen }: { onOpen: (id: ProductId) => void }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState<OsNotification[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    const timers = OS_NOTIFICATIONS.map((n, i) =>
      window.setTimeout(
        () => setShown((list) => (list.some((x) => x.id === n.id) ? list : [...list, n])),
        reduce ? 0 : FIRST_DELAY + i * STAGGER,
      ),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [reduce])

  const dismiss = (id: string) => setDismissed((list) => [...list, id])
  const visible = shown.filter((n) => !dismissed.includes(n.id))

  return (
    <section className="os-notifs" aria-label="Notifications" aria-live="polite">
      <AnimatePresence initial={false}>
        {visible.map((n) => (
          <Notification key={n.id} n={n} reduce={Boolean(reduce)} onDismiss={() => dismiss(n.id)} onOpen={() => onOpen(n.app)} />
        ))}
      </AnimatePresence>
    </section>
  )
}

function Notification({
  n,
  reduce,
  onDismiss,
  onOpen,
}: {
  n: OsNotification
  reduce: boolean
  onDismiss: () => void
  onOpen: () => void
}) {
  const [dragging, setDragging] = useState(false)

  function onDragEnd(_: unknown, info: PanInfo) {
    setDragging(false)
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) onDismiss()
  }

  return (
    <motion.article
      layout={!reduce}
      className="os-notif"
      initial={reduce ? false : { opacity: 0, x: -32, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -420, transition: { duration: 0.26, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.9, right: 0.05 }}
      dragSnapToOrigin
      onDragStart={() => setDragging(true)}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        className="os-notif-main"
        onClick={() => {
          if (!dragging) onOpen()
        }}
      >
        <img className="os-notif-icon" src={osProduct(n.app).icon} alt="" width={32} height={32} draggable={false} />
        <span className="os-notif-text">
          <span className="os-notif-title">{n.title}</span>
          <span className="os-notif-body">{n.body}</span>
        </span>
      </button>
      <button type="button" className="os-notif-close" aria-label={`Dismiss ${n.title} notification`} onClick={onDismiss}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </motion.article>
  )
}
