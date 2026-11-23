import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { WalletState } from '../wallet'
import { XBG_WIDGET } from './data'
import XbgChart, { formatPrice } from './XbgChart'
import { useXbgMarket } from './xbgMarket'

// Flashes green or red for a moment when the price moves.
function usePriceTick(price: number | null) {
  const prev = useRef(price)
  const [tick, setTick] = useState<{ dir: 'up' | 'down'; n: number } | null>(null)
  useEffect(() => {
    const before = prev.current
    prev.current = price
    if (before === null || price === null || before === price) return
    setTick((t) => ({ dir: price > before ? 'up' : 'down', n: (t?.n ?? 0) + 1 }))
  }, [price])
  return tick
}

// The XBG widget in the top right corner. It floats in, the change counts up
// and the curve draws itself from left to right.
export default function XbgWidget({
  wallet,
  onStake,
}: {
  wallet: WalletState
  onStake: () => void
}) {
  const reduce = useReducedMotion()
  const { quote, points } = useXbgMarket()
  const tick = usePriceTick(quote.price)
  const value = useMotionValue(reduce ? quote.change : 0)
  const text = useTransform(value, (v) => `${Math.abs(v).toFixed(2)}%`)
  const down = quote.change < 0

  useEffect(() => {
    if (reduce) {
      value.set(quote.change)
      return
    }
    const first = value.get() === 0
    const controls = animate(value, quote.change, { duration: first ? 1.6 : 0.8, delay: first ? 0.55 : 0, ease: [0.65, 0, 0.35, 1] })
    return () => controls.stop()
  }, [reduce, value, quote.change])

  const changeText = `${down ? 'down' : 'up'} ${Math.abs(quote.change).toFixed(2)}% over ${XBG_WIDGET.period}`
  return (
    <motion.aside
      className="os-widget"
      aria-label={`XBG price${quote.price !== null ? ` ${formatPrice(quote.price)}` : ''}, ${changeText}`}
      initial={reduce ? false : { opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.15 }}
    >
      <div className="os-widget-head">
        <div className="os-widget-top">
          <p className="os-widget-label">
            {XBG_WIDGET.label}
          </p>
          {quote.price !== null ? (
            <p key={tick?.n ?? 0} className={`os-widget-price${tick ? ` is-${tick.dir}` : ''}`}>
              {formatPrice(quote.price)}
            </p>
          ) : null}
        </div>
        <div className={`os-widget-change${down ? ' is-down' : ''}`}>
          {/* The arrow lives in its own span so turning it over for a fall
              never fights the entrance animation's transform. */}
          <motion.span
            className="os-widget-arrow"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            aria-hidden="true"
          >
            <svg width="16" height="8" viewBox="0 0 14.59 7.79" fill="currentColor">
              <path d="M6.94.15a.5.5 0 0 1 .71 0l6.79 6.79a.5.5 0 0 1-.35.85H.5a.5.5 0 0 1-.35-.85L6.94.15Z" />
            </svg>
          </motion.span>
          <motion.p className="os-widget-value">{text}</motion.p>
          <p className="os-widget-period">{XBG_WIDGET.period}</p>
        </div>
      </div>
      <div className="os-widget-chart">
        {points ? (
          <XbgChart points={points} />
        ) : (
          <>
            <img src="/V2/os/chart-1.svg" alt="" className="os-chart-low" />
            <img src="/V2/os/chart-2.svg" alt="" className="os-chart-high" />
            <img src="/V2/os/chart-3.svg" alt="" className="os-chart-low" />
            <img src="/V2/os/chart-4.svg" alt="" className="os-chart-high" />
          </>
        )}
      </div>
      <button type="button" className="os-widget-wallet" onClick={onStake} disabled={wallet === 'connecting'}>
        <span>{wallet === 'connecting' ? 'Connecting' : XBG_WIDGET.stake}</span>
        <img src="/V2/os/v2/wallet.svg" alt="" width={24} height={24} />
      </button>
    </motion.aside>
  )
}
