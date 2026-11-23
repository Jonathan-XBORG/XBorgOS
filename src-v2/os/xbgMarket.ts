import { useSyncExternalStore } from 'react'
import { XBG_COINGECKO_ID, XBG_WIDGET } from './data'
import type { PricePoint } from './XbgChart'

// Live XBG market data from CoinGecko, shared by the widget and the Live
// wallpaper. The price is polled every 15 seconds (CoinGecko refreshes its
// public price about once a minute); the 24h curve is reloaded every 5
// minutes and each new price is appended to it in between. Polling runs only
// while something is subscribed and the tab is visible.

const DESIGN_CHANGE = Number.parseFloat(XBG_WIDGET.change)
const API = 'https://api.coingecko.com/api/v3'
const PRICE_URL = `${API}/simple/price?ids=${XBG_COINGECKO_ID}&vs_currencies=usd&include_24hr_change=true`
const CHART_URL = `${API}/coins/${XBG_COINGECKO_ID}/market_chart?vs_currency=usd&days=1`
const PRICE_MS = 15_000
const CHART_MS = 300_000
const DAY_MS = 86_400_000

export type Quote = { price: number | null; change: number }
export type Market = { quote: Quote; points: PricePoint[] | null }

let state: Market = { quote: { price: XBG_WIDGET.fallbackPrice, change: DESIGN_CHANGE }, points: null }
const listeners = new Set<() => void>()
let timers: number[] = []

function set(next: Market) {
  state = next
  listeners.forEach((l) => l())
}

async function loadPrice() {
  if (document.hidden) return
  try {
    const res = await fetch(PRICE_URL)
    if (!res.ok) return
    const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>
    const row = data[XBG_COINGECKO_ID]
    if (typeof row?.usd !== 'number') return
    const price = row.usd
    let points = state.points
    if (points) {
      const now = Date.now()
      const last = points[points.length - 1]
      if (!(last && last[1] === price && now - last[0] < 60_000)) points = [...points.filter(([t]) => t >= now - DAY_MS), [now, price]]
    }
    set({ quote: { price, change: typeof row.usd_24h_change === 'number' ? row.usd_24h_change : DESIGN_CHANGE }, points })
  } catch {
    // Offline or rate limited: keep what is on screen.
  }
}

async function loadChart() {
  if (document.hidden) return
  try {
    const res = await fetch(CHART_URL)
    if (!res.ok) return
    const data = (await res.json()) as { prices?: PricePoint[] }
    const prices = (data.prices ?? []).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
    if (prices.length > 1) set({ ...state, points: prices })
  } catch {
    // Keep the design curve.
  }
}

const onVisible = () => {
  if (!document.hidden) loadPrice()
}

function start() {
  loadChart().then(loadPrice)
  timers = [window.setInterval(loadPrice, PRICE_MS), window.setInterval(loadChart, CHART_MS)]
  document.addEventListener('visibilitychange', onVisible)
}

function stop() {
  timers.forEach(window.clearInterval)
  timers = []
  document.removeEventListener('visibilitychange', onVisible)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) start()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stop()
  }
}

export function getMarket() {
  return state
}

export function subscribeMarket(listener: () => void) {
  return subscribe(listener)
}

export function useXbgMarket(): Market {
  return useSyncExternalStore(subscribe, getMarket, getMarket)
}
