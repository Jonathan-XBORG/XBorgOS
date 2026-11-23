import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import Notes from './components/Notes'
import References from './components/References'
import SystemSheet from './components/SystemSheet'
import Desktop from './os/Desktop'
import {
  hrefFor,
  isLandingScreen,
  isStakeScreen,
  parseHash,
  type NavigationSource,
  type ScreenId,
} from './screens'
import { CONNECT_DELAY_MS, isStakeEntry, type WalletState } from './wallet'

function canonicaliseHash() {
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw) return
  const id = parseHash()
  if (id !== raw && id !== 'workspace') {
    window.history.replaceState(window.history.state, '', `${window.location.search}#${id}`)
  }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenId>(() =>
    typeof window === 'undefined' ? 'workspace' : parseHash(),
  )
  const [navigationSource, setNavigationSource] = useState<NavigationSource>('direct')
  const [wallet, setWallet] = useState<WalletState>('disconnected')
  const connectTimer = useRef<number | null>(null)
  const reduceMotion = useReducedMotion()

  function go(next: ScreenId) {
    setNavigationSource('push')
    setScreen(next)
    // Keep query flags such as present=1 while moving between review states.
    window.history.pushState(null, '', `${window.location.search}${hrefFor(next).replace(/^\//, '')}`)
  }

  function connectWallet() {
    if (wallet !== 'disconnected') return
    setWallet('connecting')
    connectTimer.current = window.setTimeout(
      () => {
        connectTimer.current = null
        setWallet('connected')
        go('stake-not-verified')
      },
      reduceMotion ? 0 : CONNECT_DELAY_MS,
    )
  }

  // Old review links (the XBG Portal hashes) open their Stake state under its
  // current name, so the selector and the address agree.
  useEffect(() => {
    canonicaliseHash()
  }, [])

  useEffect(() => {
    const sync = () => {
      setNavigationSource('history')
      setScreen(parseHash())
      canonicaliseHash()
    }
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  // The Stake route decides the wallet state, so the menu bar and Stake always agree.
  useEffect(() => {
    if (!isStakeScreen(screen)) return
    if (isStakeEntry(screen)) {
      setWallet((current) => (current === 'connecting' ? current : 'disconnected'))
    } else {
      if (connectTimer.current) window.clearTimeout(connectTimer.current)
      connectTimer.current = null
      setWallet('connected')
    }
  }, [screen])

  useEffect(() => () => {
    if (connectTimer.current) window.clearTimeout(connectTimer.current)
  }, [])

  return (
    <>
      {screen === 'notes' && <Notes />}
      {screen === 'system' && <SystemSheet />}
      {screen === 'references' && <References />}
      {isLandingScreen(screen) && (
        <Desktop
          screen={screen}
          navigationSource={navigationSource}
          wallet={wallet}
          onGo={go}
          onConnectWallet={connectWallet}
          onResetDemo={() => go('stake-entry')}
        />
      )}
    </>
  )
}
