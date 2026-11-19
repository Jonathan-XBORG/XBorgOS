import { OPEN_STAKE_LABEL, PORTAL_PANEL_LINE } from '../conversation'
import { IconArrow, IconPortal } from './Icons'
import Reveal from './Reveal'

export default function PortalPanel({ onEnter }: { onEnter: () => void }) {
  return (
    <Reveal className="portal-panel" data-panel="portal">
      <span className="product-tile-icon is-portal">
        <IconPortal />
      </span>
      <p className="portal-panel-line">{PORTAL_PANEL_LINE}</p>
      <span className="btn-wrap">
        <button type="button" className="btn btn-primary" onClick={onEnter}>
          {OPEN_STAKE_LABEL}
          <IconArrow />
        </button>
      </span>
    </Reveal>
  )
}
