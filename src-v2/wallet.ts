import { assertPublicCopy } from './copyGuard'
import { DEMO_WALLET, formatXbg } from './components/stake/config'
import type { ScreenId } from './screens'

// One wallet state for the whole prototype. The menu bar and Stake read it.
export type WalletState = 'disconnected' | 'connecting' | 'connected'

export const WALLET_ADDRESS = DEMO_WALLET.address
// The menu bar shows what the wallet holds, the one number a holder checks first.
export const WALLET_BALANCE = formatXbg(DEMO_WALLET.balance)
export const CONNECT_DELAY_MS = 700

export const WALLET_MENU = {
  open: assertPublicCopy('Open Stake'),
  copy: assertPublicCopy('Copy address'),
  disconnect: assertPublicCopy('Disconnect'),
}

// Stake states shown before a wallet connects.
export function isStakeEntry(screen: ScreenId): boolean {
  return screen === 'stake-entry' || screen === 'stake-restricted'
}
