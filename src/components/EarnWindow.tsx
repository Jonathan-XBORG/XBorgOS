import type { ScreenId } from '../screens'
import AppWindow, { centred, type WindowOrigin } from './AppWindow'

const MIN_SIZE = { w: 520, h: 400 }
const INITIAL = centred(760, 560)

// Earn is a placeholder app. Its product is not defined yet, so the window
// carries only its title and the normal controls.
export default function EarnWindow({
  screen,
  origin,
  onClose,
}: {
  screen: ScreenId
  origin: WindowOrigin | null
  onClose: () => void
}) {
  return (
    <AppWindow
      id="earn"
      open={screen === 'earn'}
      title="EARN"
      className="window-product window-earn"
      min={MIN_SIZE}
      initial={INITIAL}
      origin={origin}
      onClose={onClose}
    >
      <div className="window-body earn-body" />
    </AppWindow>
  )
}
