import { useEffect, useRef, useState } from 'react'
import { SCREENS, isStakeScreen, type NavigationSource, type ProductId, type ScreenId } from '../screens'
import { isStakeEntry, type WalletState } from '../wallet'
import { ChatRootContext } from './chatRoot'
import Conversation from './Conversation'
import Dock, { type DockAppId } from './Dock'
import EarnWindow from './EarnWindow'
import MobileHero from './MobileHero'
import Sky from './Sky'
import ProductWindow, { type WindowOrigin } from './ProductWindow'
import StakeWindow from './StakeWindow'
import TopBar from './TopBar'
import XborgWindow from './XborgWindow'

// The menu bar names the app in front.
const APP_NAMES: Record<DockAppId, string> = {
  propr: 'Propr',
  fanbase: 'FanBase',
  trigr: 'Trigr',
  stake: 'Stake',
  earn: 'Earn',
}

export function shouldForwardWheel(target: EventTarget | null, windowBody: HTMLElement): boolean {
  return !(target instanceof Node && windowBody.contains(target))
}

export default function Workspace({
  screen,
  navigationSource,
  wallet,
  onGo,
  onConnectWallet,
  onDisconnectWallet,
  onResetDemo,
}: {
  screen: ScreenId
  navigationSource: NavigationSource
  wallet: WalletState
  onGo: (id: ScreenId) => void
  onConnectWallet: () => void
  onDisconnectWallet: () => void
  onResetDemo: () => void
}) {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<DockAppId | null>(null)
  const lastStakeScreen = useRef<ScreenId>('stake-not-verified')
  const [progress, setProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [productOrigin, setProductOrigin] = useState<WindowOrigin | null>(null)
  const productOpen =
    screen === 'propr' || screen === 'fanbase' || screen === 'trigr'
  const stakeOpen = isStakeScreen(screen)
  const earnOpen = screen === 'earn'
  const appOpen = productOpen || stakeOpen || earnOpen
  const activeAppId: DockAppId | null = productOpen
    ? (screen as ProductId)
    : stakeOpen
      ? 'stake'
      : earnOpen
        ? 'earn'
        : null
  const previousAppOpenRef = useRef(appOpen)

  function rememberOrigin(id: DockAppId) {
    launcherRef.current = id
    const tile = workspaceRef.current?.querySelector<HTMLElement>(`[data-dock="${id}"]`)
    if (!tile) return
    const rect = tile.getBoundingClientRect()
    setProductOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }

  function updateProgress() {
    const el = bodyRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setProgress(max <= 0 ? 0 : el.scrollTop / max)
    setScrolled(el.scrollTop >= 40)
  }

  function openProduct(id: ProductId) {
    rememberOrigin(id)
    onGo(id)
  }

  // A connected visitor returns to where they were. Otherwise Stake opens at its visitor view.
  function openStake() {
    rememberOrigin('stake')
    onGo(wallet === 'connected' ? lastStakeScreen.current : 'stake-entry')
  }

  function openEarn() {
    rememberOrigin('earn')
    onGo('earn')
  }

  function openApp(id: DockAppId) {
    if (id === 'stake') openStake()
    else if (id === 'earn') openEarn()
    else openProduct(id)
  }

  function closeApp() {
    onGo('workspace')
  }

  // Dialog states are review entry points, so reopening returns to the view behind them.
  useEffect(() => {
    if (!stakeOpen || isStakeEntry(screen)) return
    if (SCREENS.find((s) => s.id === screen)?.group === 'Stake') lastStakeScreen.current = screen
  }, [stakeOpen, screen])

  useEffect(() => {
    if (appOpen && activeAppId && launcherRef.current !== activeAppId) {
      launcherRef.current = activeAppId
    }
    if (!appOpen && previousAppOpenRef.current && launcherRef.current) {
      const id = launcherRef.current
      window.requestAnimationFrame(() => {
        workspaceRef.current?.querySelector<HTMLElement>(`[data-dock="${id}"]`)?.focus()
      })
      launcherRef.current = null
    }
    previousAppOpenRef.current = appOpen
  }, [activeAppId, appOpen])

  useEffect(() => {
    if (appOpen || window.matchMedia('(max-width: 899px)').matches) return
    bodyRef.current?.focus()
  }, [appOpen])

  useEffect(() => {
    const workspace = workspaceRef.current
    const windowBody = bodyRef.current
    if (!workspace || !windowBody) return
    const onWheel = (event: WheelEvent) => {
      if (window.matchMedia('(max-width: 899px)').matches) return
      if (appOpen) return
      if (!shouldForwardWheel(event.target, windowBody)) return
      event.preventDefault()
      windowBody.scrollTop += event.deltaY
      updateProgress()
    }
    workspace.addEventListener('wheel', onWheel, { passive: false })
    return () => workspace.removeEventListener('wheel', onWheel)
  }, [appOpen])

  return (
    <div className="workspace" ref={workspaceRef}>
      <Sky scene={activeAppId ?? 'night'} drift={progress} />
      <TopBar
        appName={activeAppId ? APP_NAMES[activeAppId] : 'XBorg'}
        progress={progress}
        scrolled={scrolled}
        wallet={wallet}
        onConnect={openStake}
        onOpenStake={openStake}
        onDisconnect={onDisconnectWallet}
        onOpenApp={openApp}
      />
      <ChatRootContext.Provider value={bodyRef}>
        <XborgWindow dimmed={appOpen} bodyRef={bodyRef} onScroll={updateProgress}>
          <MobileHero onOpenStake={openStake} />
          <Conversation onOpenProduct={openProduct} onOpenStake={openStake} />
        </XborgWindow>
      </ChatRootContext.Provider>
      <ProductWindow screen={screen} origin={productOrigin} onClose={closeApp} />
      <StakeWindow
        screen={screen}
        navigationSource={navigationSource}
        origin={productOrigin}
        wallet={wallet}
        onGo={onGo}
        onConnectWallet={onConnectWallet}
        onReset={onResetDemo}
        onClose={closeApp}
      />
      <EarnWindow screen={screen} origin={productOrigin} onClose={closeApp} />
      <Dock
        screen={screen}
        onOpen={openApp}
      />
    </div>
  )
}
