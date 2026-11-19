import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { WalletState } from '../wallet'
import { XBG_COINGECKO_ID, XBG_TOKEN_ICON, XBG_WIDGET } from './data'
import XbgChart, { formatPrice, type PricePoint } from './XbgChart'

const DESIGN_CHANGE = Number.parseFloat(XBG_WIDGET.change)
const API = 'https://api.coingecko.com/api/v3'
const PRICE_URL = `${API}/simple/price?ids=${XBG_COINGECKO_ID}&vs_currencies=usd&include_24hr_change=true`
const CHART_URL = `${API}/coins/${XBG_COINGECKO_ID}/market_chart?vs_currency=usd&days=1`
// The price is polled every 15 seconds (CoinGecko refreshes its public price
// about once a minute); the full 24h curve is reloaded every 5 minutes and
// each new price is appended to it in between.
const PRICE_MS = 15_000
const CHART_MS = 300_000
const DAY_MS = 86_400_000

type Quote = { price: number | null; change: number }

// Live XBG price, 24h change and 24h curve from CoinGecko. Until it answers
// (or if it can't be reached) the design's values and curve show.
function useXbgMarket(): { quote: Quote; points: PricePoint[] | null } {
  const [quote, setQuote] = useState<Quote>({ price: XBG_WIDGET.fallbackPrice, change: DESIGN_CHANGE })
  const [points, setPoints] = useState<PricePoint[] | null>(null)
  useEffect(() => {
    let alive = true
    const loadPrice = async () => {
      if (document.hidden) return
      try {
        const res = await fetch(PRICE_URL)
        if (!res.ok) return
        const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>
        const row = data[XBG_COINGECKO_ID]
        if (!alive || typeof row?.usd !== 'number') return
        const price = row.usd
        setQuote({ price, change: typeof row.usd_24h_change === 'number' ? row.usd_24h_change : DESIGN_CHANGE })
        setPoints((list) => {
          if (!list) return list
          const now = Date.now()
          const last = list[list.length - 1]
          if (last && last[1] === price && now - last[0] < 60_000) return list
          return [...list.filter(([t]) => t >= now - DAY_MS), [now, price]]
        })
      } catch {
        // Offline or rate limited: keep what is on screen.
      }
    }
    const loadChart = async () => {
      if (document.hidden) return
      try {
        const res = await fetch(CHART_URL)
        if (!res.ok) return
        const data = (await res.json()) as { prices?: PricePoint[] }
        const prices = (data.prices ?? []).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
        if (alive && prices.length > 1) setPoints(prices)
      } catch {
        // Keep the design curve.
      }
    }
    loadChart().then(loadPrice)
    const priceTimer = window.setInterval(loadPrice, PRICE_MS)
    const chartTimer = window.setInterval(loadChart, CHART_MS)
    const onVisible = () => {
      if (!document.hidden) loadPrice()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      window.clearInterval(priceTimer)
      window.clearInterval(chartTimer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return { quote, points }
}

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
            <img src="/os/chart-1.svg" alt="" className="os-chart-low" />
            <img src="/os/chart-2.svg" alt="" className="os-chart-high" />
            <img src="/os/chart-3.svg" alt="" className="os-chart-low" />
            <img src="/os/chart-4.svg" alt="" className="os-chart-high" />
          </>
        )}
      </div>
      <button type="button" className="os-widget-wallet" onClick={onStake} disabled={wallet === 'connecting'}>
        <span>{wallet === 'connecting' ? 'Connecting' : XBG_WIDGET.stake}</span>
        <img src="/os/wallet-icon.svg" alt="" width={24} height={24} />
      </button>
    </motion.aside>
  )
}
