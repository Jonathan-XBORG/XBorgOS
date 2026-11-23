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
            className={`os-dock-item os-dock-all${missionOpen ? ' is-running' : ''}`}
            data-dock="all"
            aria-label="All apps"
            aria-pressed={missionOpen}
            onClick={onAll}
          >
            <img src="/V2/os/v2/dock-all.svg" alt="" width={44} height={44} draggable={false} />
            <span className="os-dock-label">All apps</span>
          </button>
        </li>
        {OS_PRODUCTS.map((p) => item(p.id, p.name, <img src={p.dockIcon} alt="" width={44} height={44} draggable={false} />))}
        {item('stake', 'Stake', <img src="/V2/os/v2/dock-stake.svg" alt="" width={44} height={44} draggable={false} />)}
        {tile(
          'chat',
          'Messages',
          <span className="os-dock-tile os-dock-messages" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.675 3.675H15.675V11.925H7.425L3.675 14.925V3.675Z" stroke="currentColor" strokeWidth="1.35" />
            </svg>
          </span>,
          messagesOpen,
          onMessages,
        )}
        <li className="os-dock-rule" aria-hidden="true" />
        <li>
          <a className="os-dock-item os-dock-social" href={LINKS.x} target="_blank" rel="noreferrer" aria-label="XBorg on X">
            <img src="/V2/os/v2/link-x.svg" alt="" width={20} height={19} draggable={false} />
            <span className="os-dock-label">X</span>
          </a>
        </li>
        <li>
          <a className="os-dock-item os-dock-social" href={LINKS.discord} target="_blank" rel="noreferrer" aria-label="XBorg Discord">
            <img src="/V2/os/v2/link-discord.svg" alt="" width={20} height={19} draggable={false} />
            <span className="os-dock-label">Discord</span>
          </a>
        </li>
      </ul>
    </nav>
  )
}
