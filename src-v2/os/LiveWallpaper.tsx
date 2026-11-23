import { useEffect, useRef } from 'react'
import { formatPrice } from './XbgChart'
import { getMarket, subscribeMarket } from './xbgMarket'

// The "Live XBG" wallpaper: the last 24 hours of the XBG price drawn across
// the whole desktop, green above the opening price and red below, with a
// pulse on the latest price. It redraws as new prices arrive.

const GREEN = '#16C784'
const RED = '#EA3943'

export default function LiveWallpaper() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    // The curve is painted once per data change into this layer; each frame
    // only copies it and draws the pulse.
    const layer = document.createElement('canvas')
    const lctx = layer.getContext('2d')!
    let dot: { x: number; y: number; color: string } | null = null

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth || window.innerWidth
      h = canvas.clientHeight || window.innerHeight
      canvas.width = layer.width = Math.round(w * dpr)
      canvas.height = layer.height = Math.round(h * dpr)
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paint()
    }

    function paint() {
      const c = lctx
      dot = null
      const { points, quote } = getMarket()
      const bg = c.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.75)
      bg.addColorStop(0, '#0c1714')
      bg.addColorStop(1, '#040506')
      c.fillStyle = bg
      c.fillRect(0, 0, w, h)

      // Grid.
      c.strokeStyle = 'rgba(255,255,255,0.045)'
      c.lineWidth = 1
      c.beginPath()
      const step = Math.max(80, Math.round(w / 16))
      for (let x = step; x < w; x += step) {
        c.moveTo(Math.round(x) + 0.5, 0)
        c.lineTo(Math.round(x) + 0.5, h)
      }
      for (let y = step; y < h; y += step) {
        c.moveTo(0, Math.round(y) + 0.5)
        c.lineTo(w, Math.round(y) + 0.5)
      }
      c.stroke()

      const top = h * 0.2
      const bottom = h * 0.74
      c.font = '500 13px "Geist Mono", ui-monospace, monospace'

      if (!points || points.length < 2) {
        c.fillStyle = 'rgba(255,255,255,0.35)'
        c.fillText('Waiting for live XBG data…', 32, h - 48)
        c.strokeStyle = 'rgba(22,199,132,0.4)'
        c.setLineDash([6, 8])
        c.beginPath()
        c.moveTo(0, (top + bottom) / 2)
        c.lineTo(w, (top + bottom) / 2)
        c.stroke()
        c.setLineDash([])
        return
      }

      const t0 = points[0][0]
      const t1 = points[points.length - 1][0]
      let lo = Infinity
      let hi = -Infinity
      for (const [, p] of points) {
        lo = Math.min(lo, p)
        hi = Math.max(hi, p)
      }
      if (hi === lo) hi = lo * 1.001 + 1e-9
      // The curve stops short of the right edge so the pulse stays in view.
      const X = (t: number) => ((t - t0) / Math.max(1, t1 - t0)) * (w - 56)
      const Y = (p: number) => bottom - ((p - lo) / (hi - lo)) * (bottom - top)
      const base = Y(points[0][1])

      const trace = () => {
        c.beginPath()
        points.forEach(([t, p], i) => (i ? c.lineTo(X(t), Y(p)) : c.moveTo(X(t), Y(p))))
      }

      // Opening price line.
      c.strokeStyle = 'rgba(255,255,255,0.18)'
      c.setLineDash([4, 6])
      c.beginPath()
      c.moveTo(0, base)
      c.lineTo(w, base)
      c.stroke()
      c.setLineDash([])

      for (const [color, clipTop, clipH, from, to] of [
        [GREEN, 0, base, top, base],
        [RED, base, h - base, base, bottom],
      ] as const) {
        c.save()
        c.beginPath()
        c.rect(0, clipTop, w, clipH)
        c.clip()
        // Area between the curve and the opening price.
        const fill = c.createLinearGradient(0, from, 0, to)
        const strong = color === GREEN ? 0 : 1
        fill.addColorStop(strong, `${color}55`)
        fill.addColorStop(1 - strong, `${color}00`)
        trace()
        c.lineTo(X(t1), base)
        c.lineTo(0, base)
        c.closePath()
        c.fillStyle = fill
        c.fill()
        // Glowing line.
        trace()
        c.strokeStyle = color
        c.lineWidth = 2.5
        c.lineJoin = 'round'
        c.shadowColor = color
        c.shadowBlur = 18
        c.stroke()
        c.restore()
      }

      // Where the pulse goes (drawn every frame).
      const [lt, lp] = points[points.length - 1]
      dot = { x: X(lt), y: Y(lp), color: Y(lp) <= base ? GREEN : RED }

      // Price and 24h change, just left of the latest point.
      const price = quote.price ?? points[points.length - 1][1]
      const change = quote.change
      c.textAlign = 'right'
      c.font = '500 15px "Geist Mono", ui-monospace, monospace'
      c.fillStyle = 'rgba(255,255,255,0.6)'
      c.fillText(`XBG ${formatPrice(price)}`, dot.x - 22, dot.y - 26)
      c.fillStyle = change < 0 ? RED : GREEN
      c.fillText(`${change < 0 ? '▼' : '▲'} ${Math.abs(change).toFixed(2)}%  24h`, dot.x - 22, dot.y - 6)
      c.textAlign = 'left'
    }

    function frame(time: number) {
      const c = ctx!
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.drawImage(layer, 0, 0)
      if (!dot) return
      const dpr = canvas.width / w
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      const phase = reduce ? 0.5 : (time / 1600) % 1
      c.fillStyle = dot.color
      c.globalAlpha = 0.35 * (1 - phase)
      c.beginPath()
      c.arc(dot.x, dot.y, 6 + phase * 22, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1
      c.beginPath()
      c.arc(dot.x, dot.y, 5, 0, Math.PI * 2)
      c.fill()
    }

    // About 30 frames a second is plenty for the pulse.
    let lastFrame = 0
    const loop = (time: number) => {
      if (time - lastFrame > 32) {
        lastFrame = time
        frame(time)
      }
      raf = reduce || document.hidden ? 0 : requestAnimationFrame(loop)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop)
    }
    size()
    frame(0)
    kick()
    const unsubscribe = subscribeMarket(() => {
      paint()
      frame(performance.now())
    })
    const onResize = () => {
      size()
      frame(performance.now())
    }
    const onVisible = () => {
      if (!document.hidden && !reduce) kick()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      unsubscribe()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return <canvas ref={ref} className="os-wallpaper-live" aria-hidden="true" />
}
