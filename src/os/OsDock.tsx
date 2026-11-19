import type { ReactNode } from 'react'
import type { DockAppId } from '../components/Dock'
import { LINKS, OS_PRODUCTS } from './data'
import OsSearch from './OsSearch'

export type OsDockApp = 'all' | DockAppId

// The dock: search, All apps, the three products, Stake and Earn, then the
// two external links. A dot sits under every app with an open window.
export default function OsDock({
  running,
  missionOpen,
  onAll,
  onOpen,
}: {
  running: DockAppId[]
  missionOpen: boolean
  onAll: () => void
  onOpen: (id: DockAppId) => void
}) {
  const item = (id: DockAppId, label: string, content: ReactNode) => (
    <li key={id}>
      <button
        type="button"
        className={`os-dock-item${running.includes(id) ? ' is-running' : ''}`}
        data-dock={id}
        aria-label={label}
        aria-current={running.includes(id) ? 'true' : undefined}
        onClick={() => onOpen(id)}
      >
        {content}
        <span className="os-dock-label">{label}</span>
        {running.includes(id) ? <span className="os-dock-dot" aria-hidden="true" /> : null}
      </button>
    </li>
  )

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
        {item('earn', 'Earn', <img src="/os/button-earn.svg" alt="" width={48} height={48} draggable={false} />)}
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
