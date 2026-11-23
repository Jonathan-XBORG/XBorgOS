import { Fragment, useEffect, useState, type ReactNode } from 'react'
import type { InfoRow, OsProduct, OsWallpaper } from './data'
import { CLIENTS_INTRO, OS_CLIENTS, OS_STATS, OS_WALLPAPERS, README_LINES, SECRET_TEXT, STAKE_PAGE, STAKE_URL } from './data'

export function DiscoverButton({ product }: { product: OsProduct }) {
  return (
    <a className="os-cta" href={product.href} target="_blank" rel="noreferrer">
      <span>{product.action}</span>
      <img src="/V2/os/arrow-out.svg" alt="" width={12} height={12} />
    </a>
  )
}

// A product window: capture on the left, pitch and link on the right.
export function ProductContent({ product }: { product: OsProduct }) {
  return (
    <div className="os-product">
      <img className="os-shot" src={product.shot} alt={`${product.name} interface`} />
      <div className="os-product-copy">
        <div className="os-product-text">
          <p className="os-lead">{product.lead}</p>
          {product.proof ? <p className="os-proof">{product.proof}</p> : null}
        </div>
        <DiscoverButton product={product} />
      </div>
    </div>
  )
}

const PRODUCT_LINKS: Record<string, string> = {
  fanbase: 'https://fanbase.gg/',
  propr: 'https://propr.xyz',
}
const NAMES = /\b(FanBase|Fanbase|Propr)\b/g

// Every mention of a product links to its site. The one line that sets the
// names in bold in the design keeps them bold.
function withLinks(line: string) {
  const bold = line.startsWith('FanBase grew')
  return line.split(NAMES).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
    const link = (
      <a key={i} className="os-readme-link" href={PRODUCT_LINKS[part.toLowerCase()]} target="_blank" rel="noreferrer">
        {part}
      </a>
    )
    return bold ? <strong key={i}>{link}</strong> : link
  })
}

// Readme.txt: the site's story, one line per paragraph.
export function ReadmeContent() {
  return (
    <div className="os-readme">
      {README_LINES.map((line) => (
        <p key={line}>{withLinks(line)}</p>
      ))}
    </div>
  )
}

export function FolderContent() {
  return (
    <div className="os-folder-empty">
      <p>This folder is empty for now.</p>
    </div>
  )
}

// Clients: same reading layout as about_us.txt, then the logos.
export function ClientsContent() {
  return (
    <div className="os-readme os-clients">
      {CLIENTS_INTRO.map((line) => (
        <p key={line}>{withLinks(line)}</p>
      ))}
      <ul className="os-client-grid">
        {OS_CLIENTS.map((c) => (
          <li key={c.id} className="os-client" title={c.name}>
            <img src={c.logo} alt={c.name} loading="lazy" />
          </li>
        ))}
      </ul>
    </div>
  )
}

// Preferences: pick one of the desktop wallpapers. The choice is remembered.
export function PreferencesContent({ value, onChange }: { value: string; onChange: (w: OsWallpaper) => void }) {
  return (
    <div className="os-prefs">
      <h3 className="os-prefs-title">Wallpaper</h3>
      <div className="os-prefs-grid" role="radiogroup" aria-label="Wallpaper">
        {OS_WALLPAPERS.map((w) => (
          <button
            key={w.id}
            type="button"
            role="radio"
            aria-checked={w.id === value}
            className={`os-prefs-option${w.id === value ? ' is-selected' : ''}`}
            onClick={() => onChange(w)}
          >
            <span className="os-prefs-thumb" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, ${1 - w.opacity}), rgba(0, 0, 0, ${1 - w.opacity})), url('${w.thumb}')` }} />
            <span className="os-prefs-name">{w.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Stake is the live rewards page from xborg.com, embedded.
export function StakeContent() {
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 8000)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <div className="os-stake">
      <iframe
        className={`os-stake-frame${loaded ? ' is-loaded' : ''}`}
        src={STAKE_URL}
        title="XBorg Stake"
        allow="clipboard-write; web-share"
        onLoad={() => setLoaded(true)}
      />
      {loaded ? null : (
        <div className="os-stake-loading" role="status">
          <span className="os-spinner" aria-hidden="true" />
          <span>{slow ? 'Stake is taking a while to load.' : 'Loading Stake…'}</span>
          {slow ? (
            <a href={STAKE_PAGE} target="_blank" rel="noreferrer">
              Open xborg.com/earn in a new tab
            </a>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Get Info for an app or a file: icon, name, kind, then label / value rows.
export function InfoContent({ icon, name, kind, rows }: { icon: ReactNode; name: string; kind: string; rows: InfoRow[] }) {
  return (
    <div className="os-info">
      <div className="os-info-head">
        <span className="os-info-icon">{icon}</span>
        <span>
          <span className="os-info-name">{name}</span>
          <span className="os-info-kind">{kind}</span>
        </span>
      </div>
      <dl className="os-info-rows">
        {rows
          .filter((r) => r.value)
          .map((r) => (
            <Fragment key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </Fragment>
          ))}
      </dl>
    </div>
  )
}

// Time since the visitor arrived, ticking every second.
const ARRIVED = Date.now()
function useSession() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const s = Math.floor((now - ARRIVED) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(sec).padStart(2, '0')}s` : `${sec}s`
}

// About this OS (desktop right click, Get Info).
export function AboutOsContent() {
  const session = useSession()
  return (
    <div className="os-about">
      <svg className="os-about-logo" width="56" height="59" viewBox="0 0 19 20" fill="currentColor" aria-hidden="true">
        <path d="M18.54.06c.19-.14.46 0 .46.23V5.1c0 .28-.13.54-.34.7l-4.8 3.67a.83.83 0 0 1-.52.18H5.66a.83.83 0 0 1-.52-.18L.34 5.8A.88.88 0 0 1 0 5.1V.29C0 .05.27-.09.46.06l8.87 6.71c.1.08.24.08.34 0L18.54.06Z" />
        <path d="M18.54 19.94c.19.15.46.01.46-.23V14.9a.88.88 0 0 0-.34-.7l-4.8-3.67a.83.83 0 0 0-.52-.18H5.66a.83.83 0 0 0-.52.18L.34 14.2a.88.88 0 0 0-.34.7v4.81c0 .24.27.38.46.23l8.87-6.71c.1-.08.24-.08.34 0l8.87 6.71Z" />
      </svg>
      <p className="os-about-name">XBorg OS</p>
      <p className="os-about-version">Version 1.0</p>
      <dl className="os-info-rows">
        <dt>Build</dt>
        <dd className="os-mono">
          {__BUILD_HASH__} · {__BUILD_DATE__}
        </dd>
        <dt>Your session</dt>
        <dd className="os-mono">{session}</dd>
        {OS_STATS.map((r) => (
          <Fragment key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  )
}

// .secret, shown with "Show Hidden Files": the only hint for the Konami code.
export function SecretContent() {
  return (
    <div className="os-secret">
      <p className="os-mono">{SECRET_TEXT}</p>
    </div>
  )
}
