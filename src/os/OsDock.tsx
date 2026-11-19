import type { ReactNode } from 'react'
import type { DockAppId } from '../components/Dock'
import { LINKS, OS_PRODUCTS } from './data'
import OsSearch from './OsSearch'

export type OsDockApp = 'all' | DockAppId

// The dock: search, All apps, the three products, Stake and Messages, then the
// two external links. A dot sits under every app with an open window.
export default function OsDock({
  running,
  missionOpen,
  messagesOpen,
  onAll,
  onOpen,
  onMessages,
}: {
  running: DockAppId[]
  missionOpen: boolean
  messagesOpen: boolean
  onAll: () => void
  onOpen: (id: DockAppId) => void
  onMessages: () => void
}) {
  const tile = (id: string, label: string, content: ReactNode, open: boolean, onClick: () => void) => (
    <li key={id}>
      <button
        type="button"
        className={`os-dock-item${open ? ' is-running' : ''}`}
        data-dock={id}
        aria-label={label}
        aria-current={open ? 'true' : undefined}
        onClick={onClick}
      >
        {content}
        <span className="os-dock-label">{label}</span>
        {open ? <span className="os-dock-dot" aria-hidden="true" /> : null}
      </button>
    </li>
  )
  const item = (id: DockAppId, label: string, content: ReactNode) => tile(id, label, content, running.includes(id), () => onOpen(id))

  return (
    <nav className="os-dock" aria-label="XBorg products">
      <OsSearch onOpenApp={onOpen} />
      <ul className="os-dock-apps">
        <li>
          <button
            type="button"
            className="os-dock-item os-dock-all"
            data-dock="all"
            aria-label="All apps"
            aria-pressed={missionOpen}
            onClick={onAll}
          >
            <span className="os-dock-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="os-dock-label">All apps</span>
          </button>
        </li>
        {OS_PRODUCTS.map((p) => item(p.id, p.name, <img src={p.dockIcon} alt="" width={48} height={48} draggable={false} />))}
        {item(
          'stake',
          'Stake',
          <span className="os-dock-stake" aria-hidden="true">
            <img src="/os/stake-icon.svg" alt="" width={20} height={22} draggable={false} />
          </span>,
        )}
        {tile(
          'chat',
          'Messages',
          <span className="os-dock-stake os-dock-messages" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 3C6.48 3 2 6.94 2 11.8c0 2.47 1.17 4.7 3.05 6.3L4.3 21.4a.5.5 0 0 0 .7.56l3.9-1.8c.98.25 2.02.38 3.1.38 5.52 0 10-3.94 10-8.8S17.52 3 12 3Z" />
            </svg>
          </span>,
          messagesOpen,
          onMessages,
        )}
        <li className="os-dock-rule" aria-hidden="true" />
        <li>
          <a className="os-dock-item" href={LINKS.x} target="_blank" rel="noreferrer" aria-label="XBorg on X">
            <img src="/os/link-x.svg" alt="" width={48} height={48} draggable={false} />
            <span className="os-dock-label">X</span>
          </a>
        </li>
        <li>
          <a className="os-dock-item" href={LINKS.discord} target="_blank" rel="noreferrer" aria-label="XBorg Discord">
            <img src="/os/link-discord.svg" alt="" width={48} height={48} draggable={false} />
            <span className="os-dock-label">Discord</span>
          </a>
        </li>
      </ul>
    </nav>
  )
}
