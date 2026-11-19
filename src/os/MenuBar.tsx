import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { DockAppId } from '../components/Dock'
import { LINKS, OS_PRODUCTS } from './data'

// The macOS style menu bar: XBorg menu on the left, quick access to the apps
// and socials where File and Edit would be, and the status area on the right
// (location, network, date and time).

const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

function cityFromTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const city = zone.split('/').pop()
    return city ? city.replace(/_/g, ' ') : null
  } catch {
    return null
  }
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer = 0
    const tick = () => {
      setNow(new Date())
      timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50)
    }
    timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50)
    return () => window.clearTimeout(timer)
  }, [])
  return now
}

function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export default function MenuBar({
  onOpenApp,
  onAbout,
  onClients,
  onMessages,
  onPreferences,
}: {
  onOpenApp: (id: DockAppId) => void
  onAbout: () => void
  onClients: () => void
  onMessages: () => void
  onPreferences: () => void
}) {
  const reduce = useReducedMotion()
  const now = useClock()
  const online = useOnline()
  const [city] = useState(cityFromTimeZone)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [menuOpen])

  const run = (fn: () => void) => () => {
    setMenuOpen(false)
    fn()
  }

  const apps: { id: DockAppId; label: string }[] = [
    ...OS_PRODUCTS.map((p) => ({ id: p.id as DockAppId, label: p.name })),
    { id: 'stake', label: 'Stake' },
  ]

  return (
    <header className="os-menubar">
      <div className="os-menubar-left">
        <div className="os-menubar-menu" ref={menuRef}>
          <button
            type="button"
            className={`os-menubar-logo${menuOpen ? ' is-open' : ''}`}
            aria-label="XBorg menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="15" height="16" viewBox="0 0 19 20" fill="currentColor" aria-hidden="true">
              <path d="M18.54.06c.19-.14.46 0 .46.23V5.1c0 .28-.13.54-.34.7l-4.8 3.67a.83.83 0 0 1-.52.18H5.66a.83.83 0 0 1-.52-.18L.34 5.8A.88.88 0 0 1 0 5.1V.29C0 .05.27-.09.46.06l8.87 6.71c.1.08.24.08.34 0L18.54.06Z" />
              <path d="M18.54 19.94c.19.15.46.01.46-.23V14.9a.88.88 0 0 0-.34-.7l-4.8-3.67a.83.83 0 0 0-.52-.18H5.66a.83.83 0 0 0-.52.18L.34 14.2a.88.88 0 0 0-.34.7v4.81c0 .24.27.38.46.23l8.87-6.71c.1-.08.24-.08.34 0l8.87 6.71Z" />
            </svg>
          </button>
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                className="os-menubar-dropdown"
                role="menu"
                aria-label="XBorg"
                initial={reduce ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.14 }}
              >
                <button type="button" role="menuitem" onClick={run(onAbout)}>
                  About XBorg
                </button>
                <button type="button" role="menuitem" onClick={run(onClients)}>
                  Clients
                </button>
                <span className="os-menubar-sep" role="separator" />
                <button type="button" role="menuitem" onClick={run(onMessages)}>
                  Messages
                </button>
                {apps.map((a) => (
                  <button key={a.id} type="button" role="menuitem" onClick={run(() => onOpenApp(a.id))}>
                    {a.label}
                  </button>
                ))}
                <span className="os-menubar-sep" role="separator" />
                <a role="menuitem" href={LINKS.x} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
                  X
                </a>
                <a role="menuitem" href={LINKS.discord} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
                  Discord
                </a>
                <span className="os-menubar-sep" role="separator" />
                <button type="button" role="menuitem" onClick={run(onPreferences)}>
                  Preferences…
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <span className="os-menubar-brand">XBorg</span>
      </div>
      <div className="os-menubar-status">
        {city ? (
          <span className="os-menubar-stat" title="Your time zone">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {city}
          </span>
        ) : null}
        <span className="os-menubar-stat" role="img" aria-label={online ? 'Online' : 'Offline'} title={online ? 'Online' : 'Offline'}>
          <svg width="16" height="13" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{ opacity: online ? 1 : 0.35 }}>
            <path d="M2 6.5a15 15 0 0 1 20 0" />
            <path d="M5.5 10a10 10 0 0 1 13 0" />
            <path d="M9 13.5a5 5 0 0 1 6 0" />
            <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <time className="os-menubar-time" dateTime={now.toISOString()}>
          <span>{DAY.format(now).replace(',', '')}</span>
          <span>{TIME.format(now)}</span>
        </time>
      </div>
    </header>
  )
}
