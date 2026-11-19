import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import type { WalletState } from '../wallet'
import { XBG_COINGECKO_ID, XBG_TOKEN_ICON, XBG_WIDGET } from './data'

const DESIGN_CHANGE = Number.parseFloat(XBG_WIDGET.change)
const PRICE_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${XBG_COINGECKO_ID}&vs_currencies=usd&include_24hr_change=true`
const REFRESH_MS = 120_000

type Quote = { price: number | null; change: number }

function formatPrice(v: number) {
  const digits = v >= 1 ? 2 : v >= 0.01 ? 4 : 6
  return `$${v.toFixed(digits)}`
}

// Live XBG price and 24h change from CoinGecko, refreshed every two minutes.
// Until it answers (or if it can't be reached) the design's values show.
function useXbgQuote(): Quote {
  const [quote, setQuote] = useState<Quote>({ price: XBG_WIDGET.fallbackPrice, change: DESIGN_CHANGE })
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(PRICE_URL)
        if (!res.ok) return
        const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>
        const row = data[XBG_COINGECKO_ID]
        if (!alive || typeof row?.usd !== 'number') return
        setQuote({ price: row.usd, change: typeof row.usd_24h_change === 'number' ? row.usd_24h_change : DESIGN_CHANGE })
      } catch {
        // Offline or rate limited: keep what is on screen.
      }
    }
    load()
    const timer = window.setInterval(load, REFRESH_MS)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])
  return quote
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
  const quote = useXbgQuote()
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
            <img
              src={XBG_TOKEN_ICON}
              alt=""
              width={22}
              height={22}
              className="os-widget-token"
              onError={(e) => {
                // SwissBorg's CDN unreachable: fall back to the local token.
                const img = e.currentTarget
                if (!img.src.endsWith('/os/xbg-token.svg')) img.src = '/os/xbg-token.svg'
              }}
            />
            {XBG_WIDGET.label}
          </p>
          {quote.price !== null ? <p className="os-widget-price">{formatPrice(quote.price)}</p> : null}
        </div>
        <div className={`os-widget-change${down ? ' is-down' : ''}`}>
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
      <button type="button" className="os-widget-wallet" onClick={onStake} disabled={wallet === 'connecting'}>
        <span>{wallet === 'connecting' ? 'Connecting' : XBG_WIDGET.stake}</span>
        <img src="/os/wallet-icon.svg" alt="" width={24} height={24} />
      </button>
    </motion.aside>
  )
}
