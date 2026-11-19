import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'
import type { WalletState } from '../wallet'
import { XBG_WIDGET } from './data'

const CHANGE = Number.parseFloat(XBG_WIDGET.change)

// The XBG widget in the top right corner. It floats in, the change counts up
// and the curve draws itself from left to right. The figures are the design's
// demo values until a price feed is wired in.
export default function XbgWidget({ wallet, onWallet }: { wallet: WalletState; onWallet: () => void }) {
  const reduce = useReducedMotion()
  const value = useMotionValue(reduce ? CHANGE : 0)
  const text = useTransform(value, (v) => `${v.toFixed(2)}%`)

  useEffect(() => {
    if (reduce) return
    const controls = animate(value, CHANGE, { duration: 1.6, delay: 0.55, ease: [0.65, 0, 0.35, 1] })
    return () => controls.stop()
  }, [reduce, value])

  const label = wallet === 'connected' ? 'Open Stake' : wallet === 'connecting' ? 'Connecting' : XBG_WIDGET.connect
  return (
    <motion.aside
      className="os-widget"
      aria-label={`XBG price, ${XBG_WIDGET.change} over ${XBG_WIDGET.period}`}
      initial={reduce ? false : { opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.15 }}
    >
      <div className="os-widget-head">
        <p className="os-widget-label">{XBG_WIDGET.label}</p>
        <div className="os-widget-change">
          <motion.img
            src="/os/price-up.svg"
            alt=""
            width={16}
            height={8}
            className="os-widget-arrow"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
          <motion.p className="os-widget-value">{text}</motion.p>
          <p className="os-widget-period">{XBG_WIDGET.period}</p>
        </div>
      </div>
      <div className="os-widget-chart" aria-hidden="true">
        <img src="/os/chart-1.svg" alt="" className="os-chart-low" />
        <img src="/os/chart-2.svg" alt="" className="os-chart-high" />
        <img src="/os/chart-3.svg" alt="" className="os-chart-low" />
        <img src="/os/chart-4.svg" alt="" className="os-chart-high" />
      </div>
      <button type="button" className="os-widget-wallet" onClick={onWallet} disabled={wallet === 'connecting'}>
        <span>{label}</span>
        <img src="/os/wallet-icon.svg" alt="" width={24} height={24} />
      </button>
    </motion.aside>
  )
}
