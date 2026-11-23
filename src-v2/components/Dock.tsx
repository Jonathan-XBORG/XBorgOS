import { isStakeScreen, type ScreenId } from '../screens'
import { IconEarn, IconMark } from './Icons'
import ProductArtwork, { PRODUCT_ARTWORK } from './ProductArtwork'

export type DockAppId = 'propr' | 'fanbase' | 'trigr' | 'stake' | 'earn'

const APPS = [
  { id: 'propr', label: 'Propr', artwork: PRODUCT_ARTWORK.propr },
  { id: 'fanbase', label: 'FanBase', artwork: PRODUCT_ARTWORK.fanbase },
  { id: 'trigr', label: 'Trigr', artwork: PRODUCT_ARTWORK.trigr },
  { id: 'stake', label: 'Stake', artwork: null },
  { id: 'earn', label: 'Earn', artwork: null },
] as const

export default function Dock({
  screen,
  onOpen,
}: {
  screen: ScreenId
  onOpen: (id: DockAppId) => void
}) {
  const active: DockAppId | null =
    screen === 'propr' || screen === 'fanbase' || screen === 'trigr'
      ? screen
      : isStakeScreen(screen)
        ? 'stake'
        : screen === 'earn'
          ? 'earn'
          : null

  return (
    <nav className="dock" aria-label="XBorg products">
      <div className="dock-tray">
        {APPS.map(({ id, label, artwork }) => (
          <button
            key={id}
            type="button"
            className={`dock-item${artwork ? ' dock-product' : ''}${active === id ? ' is-active' : ''}${artwork ? '' : ' is-portal'}`}
            data-dock={id}
            onClick={() => onOpen(id)}
            aria-label={label}
            aria-current={active === id ? 'true' : undefined}
          >
            <span className="dock-icon">
              {artwork ? (
                <ProductArtwork id={id} />
              ) : (
                <span className="xborg-favicon" aria-hidden="true">
                  {id === 'earn' ? <IconEarn /> : <IconMark />}
                </span>
              )}
            </span>
            <span className="dock-label">{label}</span>
            {active === id && <span className="dock-dot" aria-hidden="true" />}
          </button>
        ))}
        <span className="dock-rule dock-social" aria-hidden="true" />
        <a className="dock-item dock-social is-x" href="https://x.com/XBorgHQ" target="_blank" rel="noreferrer" aria-label="XBorg on X">
          <span className="dock-icon">
            <img src="/V2/icons/twitter.png" alt="" />
          </span>
          <span className="dock-label">X</span>
        </a>
        <a
          className="dock-item dock-social is-discord"
          href="https://discord.com/invite/xborg"
          target="_blank"
          rel="noreferrer"
          aria-label="XBorg Discord"
        >
          <span className="dock-icon">
            <img src="/V2/icons/discord.png" alt="" />
          </span>
          <span className="dock-label">Discord</span>
        </a>
      </div>
    </nav>
  )
}
