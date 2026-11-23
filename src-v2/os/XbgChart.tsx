import { useId, useMemo, useRef, useState, type PointerEvent } from 'react'

// The widget's 24h curve, drawn from live prices. Above the opening price it
// is green, below it red, as in the design. Hovering (or dragging a finger)
// along it shows the price at that moment.

export type PricePoint = [time: number, price: number]

const W = 222
const H = 79.38
const PAD = 4
const GREEN = '#16C784'
const RED = '#EA3943'

const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

export function formatPrice(v: number) {
  const digits = v >= 1 ? 2 : v >= 0.01 ? 4 : 6
  return `$${v.toFixed(digits)}`
}

export default function XbgChart({ points }: { points: PricePoint[] }) {
  const id = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const geo = useMemo(() => {
    const t0 = points[0][0]
    const t1 = points[points.length - 1][0]
    let lo = Infinity
    let hi = -Infinity
    for (const [, p] of points) {
      if (p < lo) lo = p
      if (p > hi) hi = p
    }
    if (hi === lo) {
      hi += hi * 0.001 || 1
      lo -= lo * 0.001 || 1
    }
    const x = (t: number) => ((t - t0) / Math.max(1, t1 - t0)) * W
    const y = (p: number) => PAD + (1 - (p - lo) / (hi - lo)) * (H - PAD * 2)
    const xy = points.map(([t, p]) => [x(t), y(p)] as const)
    const line = xy.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(2)} ${b.toFixed(2)}`).join('')
    const base = y(points[0][1])
    const area = `${line}L${W} ${base.toFixed(2)}L0 ${base.toFixed(2)}Z`
    return { xy, line, area, base, top: PAD, bottom: H - PAD }
  }, [points])

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = box.current!.getBoundingClientRect()
    const vx = ((e.clientX - r.left) / r.width) * W
    let best = 0
    let dist = Infinity
    geo.xy.forEach(([px], i) => {
      const d = Math.abs(px - vx)
      if (d < dist) {
        dist = d
        best = i
      }
    })
    setHover(best)
  }

  const h = hover !== null ? { x: geo.xy[hover][0], y: geo.xy[hover][1], p: points[hover] } : null
  const up = h ? h.y <= geo.base : true

  return (
    <div
      ref={box}
      className="os-chart-live"
      onPointerMove={onMove}
      onPointerDown={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-up`}>
            <rect x="-2" y="-2" width={W + 4} height={geo.base + 2} />
          </clipPath>
          <clipPath id={`${id}-down`}>
            <rect x="-2" y={geo.base} width={W + 4} height={H - geo.base + 2} />
          </clipPath>
          <linearGradient id={`${id}-gu`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={geo.top} y2={geo.base}>
            <stop offset="0" stopColor={GREEN} stopOpacity="0.35" />
            <stop offset="1" stopColor={GREEN} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-gd`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={geo.base} y2={geo.bottom}>
            <stop offset="0" stopColor={RED} stopOpacity="0" />
            <stop offset="1" stopColor={RED} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path d={geo.area} fill={`url(#${id}-gu)`} clipPath={`url(#${id}-up)`} />
        <path d={geo.area} fill={`url(#${id}-gd)`} clipPath={`url(#${id}-down)`} />
        <path d={geo.line} fill="none" stroke={GREEN} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" clipPath={`url(#${id}-up)`} />
        <path d={geo.line} fill="none" stroke={RED} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" clipPath={`url(#${id}-down)`} />
        {h ? (
          <line x1={h.x} x2={h.x} y1="0" y2={H} stroke="rgba(255,255,255,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
        ) : null}
      </svg>
      {h ? (
        <>
          <span
            className="os-chart-dot"
            style={{ left: `${(h.x / W) * 100}%`, top: `${(h.y / H) * 100}%`, background: up ? GREEN : RED }}
          />
          <span
            className={`os-chart-tip${h.x / W > 0.7 ? ' is-left' : h.x / W < 0.3 ? ' is-right' : ''}`}
            style={{ left: `${(h.x / W) * 100}%` }}
          >
            <strong>{formatPrice(h.p[1])}</strong>
            <span>{TIME.format(h.p[0])}</span>
          </span>
        </>
      ) : null}
    </div>
  )
}
