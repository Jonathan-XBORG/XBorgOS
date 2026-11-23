import { useEffect, useRef } from 'react'
import { isStakeScreen, type NavigationSource, type ScreenId, type StakeScreenId } from '../screens'
import { isStakeEntry, type WalletState } from '../wallet'
import AppWindow, { centred, type WindowOrigin } from './AppWindow'
import Stake from './stake/Stake'
import StakeEntry from './StakeEntry'

export const STAKE_TITLE = 'STAKE'

const MIN_SIZE = { w: 760, h: 520 }
const INITIAL = centred(1180, 720)
// The visitor view is one column, so it opens narrower and grows into the
// full app once the wallet connects.
const ENTRY_MIN_SIZE = { w: 480, h: 440 }
const ENTRY_INITIAL = centred(720, 760)

export default function StakeWindow({
  screen,
  navigationSource,
  origin,
  wallet,
  onGo,
  onConnectWallet,
  onReset,
  onClose,
}: {
  screen: ScreenId
  navigationSource: NavigationSource
  origin: WindowOrigin | null
  wallet: WalletState
  onGo: (id: ScreenId) => void
  onConnectWallet: () => void
  onReset: () => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const previousScreenRef = useRef(screen)
  const open = isStakeScreen(screen)
  const entry = isStakeEntry(screen)

  // Moving between states moves focus to the content, not back to Close.
  useEffect(() => {
    if (!open) {
      previousScreenRef.current = screen
      return
    }
    // Opening the window focuses Close. Moving between states inside it
    // focuses the content.
    const previous = previousScreenRef.current
    if (previous !== screen && isStakeScreen(previous)) {
      dialogRef.current?.querySelector<HTMLElement>('.portal-body, .portal-entry')?.focus()
    }
    previousScreenRef.current = screen
  }, [open, screen])

  return (
    <AppWindow
      id={entry ? 'stake-entry' : 'stake'}
      open={open}
      title={STAKE_TITLE}
      className={`window-portal window-stake${entry ? ' is-entry' : ''}`}
      min={entry ? ENTRY_MIN_SIZE : MIN_SIZE}
      initial={entry ? ENTRY_INITIAL : INITIAL}
      origin={origin}
      onClose={onClose}
      dialogRef={dialogRef}
      accessory={<span className="demo-badge">Demo Data</span>}
    >
      <div className="portal-window-body">
        {open && entry ? (
          <StakeEntry
            connecting={wallet === 'connecting'}
            restricted={screen === 'stake-restricted'}
            onHome={onClose}
            onConnect={onConnectWallet}
          />
        ) : null}
        {open && !entry ? (
          <Stake screen={screen as StakeScreenId} navigationSource={navigationSource} onGo={onGo} onReset={onReset} />
        ) : null}
      </div>
    </AppWindow>
  )
}
