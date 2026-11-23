import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { ProductId } from '../screens'
import { DiscoverButton } from './Contents'
import { OS_PRODUCTS } from './data'

// "All apps": the three products side by side over a blurred desktop.
export default function MissionControl({
  onOpen,
  onClose,
}: {
  onOpen: (id: ProductId) => void
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.os-mc-card')?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.div
      ref={ref}
      className="os-mc"
      role="dialog"
      aria-label="All apps"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="os-mc-row">
        {OS_PRODUCTS.map((p, i) => (
          <motion.article
            key={p.id}
            className="os-mc-card"
            tabIndex={0}
            aria-label={`Open ${p.name}`}
            initial={reduce ? false : { opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, delay: reduce ? 0 : i * 0.05 }}
            whileHover={reduce ? undefined : { y: -6 }}
            onClick={(e) => {
              if ((e.target as Element).closest('a, button')) return
              onOpen(p.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(p.id)
            }}
          >
            <header className="os-win-bar">
              <span className="os-win-icon" aria-hidden="true">
                <img src={p.icon} alt="" width={32} height={32} />
              </span>
              <h2 className="os-win-title">{p.name}</h2>
              <div className="os-win-controls">
                <button type="button" className="os-win-btn" aria-label={`Open ${p.name}`} onClick={() => onOpen(p.id)}>
                  <img src="/os/fullscreen.svg" alt="" width={24} height={24} />
                </button>
                <button type="button" className="os-win-btn" aria-label="Close all apps" onClick={onClose}>
                  <img src="/os/close.svg" alt="" width={24} height={24} />
                </button>
              </div>
            </header>
            <div className="os-mc-body">
              <img className="os-shot" src={p.shot} alt={`${p.name} interface`} />
              <div className="os-mc-copy">
                <div className="os-product-text">
                  <p className="os-lead os-lead-sm">{p.lead}</p>
                  {p.proof ? <p className="os-proof">{p.proof}</p> : null}
                </div>
                <DiscoverButton product={p} />
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>
  )
}
