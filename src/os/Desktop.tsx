import { AnimatePresence } from 'motion/react'
import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { DockAppId } from '../components/Dock'
import Stake from '../components/stake/Stake'
import StakeEntry from '../components/StakeEntry'
import { SCREENS, isStakeScreen, type NavigationSource, type ProductId, type ScreenId, type StakeScreenId } from '../screens'
import { isStakeEntry, type WalletState } from '../wallet'
import { FolderContent, ProductContent, ReadmeContent } from './Contents'
import { osProduct } from './data'
import DesktopIcon, { type DesktopItemKind } from './DesktopIcon'
import MissionControl from './MissionControl'
import Notifications from './Notifications'
import OsDock from './OsDock'
import OsWindow, { type OsWindowOrigin } from './OsWindow'
import XbgWidget from './XbgWidget'
import './os.css'

const Cursor3D = lazy(() => import('./Cursor3D'))

type AppWin = 'stake' | 'earn'
type WinId = ProductId | DesktopItemKind | AppWin
type OpenWin = { id: WinId; origin: OsWindowOrigin; cascade: number }

const PRODUCT_IDS: ProductId[] = ['propr', 'fanbase', 'trigr']
const isProduct = (id: string): id is ProductId => (PRODUCT_IDS as string[]).includes(id)
const isDesktopItem = (id: string): id is DesktopItemKind => id === 'readme' || id === 'docs' || id === 'changelog'

const ICONS: { kind: DesktopItemKind; label: string; position: CSSProperties }[] = [
  { kind: 'changelog', label: 'Changelog', position: { left: 140, top: 333 } },
  { kind: 'docs', label: 'Docs', position: { left: 82, top: 558 } },
  { kind: 'readme', label: 'Readme.txt', position: { right: 81, bottom: 143 } },
]

const WINDOW_META: Record<DesktopItemKind, { title: string; width: number; top?: number }> = {
  readme: { title: 'Readme.txt', width: 760, top: 150 },
  docs: { title: 'Docs', width: 560 },
  changelog: { title: 'Changelog', width: 560 },
}

// Where a window grows from: its dock tile, or its desktop icon.
function originOf(id: WinId): OsWindowOrigin {
  const el = isDesktopItem(id)
    ? document.querySelector<HTMLElement>(`[data-desktop-item="${id}"]`)
    : document.querySelector<HTMLElement>(`[data-dock="${id}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export default function Desktop({
  screen,
  navigationSource,
  wallet,
  onGo,
  onConnectWallet,
  onResetDemo,
}: {
  screen: ScreenId
  navigationSource: NavigationSource
  wallet: WalletState
  onGo: (id: ScreenId) => void
  onConnectWallet: () => void
  onResetDemo: () => void
}) {
  const [windows, setWindows] = useState<OpenWin[]>([])
  const [mission, setMission] = useState(false)
  const [selected, setSelected] = useState<DesktopItemKind | null>(null)
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({})
  const lastStakeScreen = useRef<ScreenId>('stake-not-verified')
  const stakeOpen = isStakeScreen(screen)
  const earnOpen = screen === 'earn'
  const entry = isStakeEntry(screen)

  function openWindow(id: WinId) {
    setMission(false)
    setWindows((list) => {
      const existing = list.find((w) => w.id === id)
      const rest = list.filter((w) => w.id !== id)
      return [...rest, existing ?? { id, origin: originOf(id), cascade: rest.length % 6 }]
    })
  }

  function closeWindow(id: WinId) {
    if (id === 'stake' || id === 'earn') onGo('workspace')
    else setWindows((list) => list.filter((w) => w.id !== id))
  }

  function focusWindow(id: WinId) {
    setWindows((list) => (list[list.length - 1]?.id === id ? list : [...list.filter((w) => w.id !== id), list.find((w) => w.id === id)!]))
  }

  function openStake() {
    setMission(false)
    if (stakeOpen) focusWindow('stake')
    else onGo(wallet === 'connected' ? lastStakeScreen.current : 'stake-entry')
  }

  function openApp(id: DockAppId) {
    if (id === 'stake') openStake()
    else if (id === 'earn') {
      setMission(false)
      if (earnOpen) focusWindow('earn')
      else onGo('earn')
    } else openWindow(id)
  }

  // Review links such as #propr open that window on the desktop.
  useEffect(() => {
    if (isProduct(screen)) openWindow(screen)
  }, [screen])

  // Stake and Earn follow the address, so every review state still has a link.
  useEffect(() => {
    for (const [id, open] of [
      ['stake', stakeOpen],
      ['earn', earnOpen],
    ] as const) {
      setWindows((list) => {
        const has = list.some((w) => w.id === id)
        if (open && !has) return [...list, { id, origin: originOf(id), cascade: list.length % 6 }]
        if (!open && has) return list.filter((w) => w.id !== id)
        return list
      })
    }
  }, [stakeOpen, earnOpen])

  useEffect(() => {
    if (!stakeOpen || entry) return
    if (SCREENS.find((s) => s.id === screen)?.group === 'Stake') lastStakeScreen.current = screen
  }, [stakeOpen, entry, screen])

  // Escape closes All apps first, then the window in front.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (document.querySelector('.portal-modal-backdrop')) return
      if (mission) setMission(false)
      else if (windows.length) closeWindow(windows[windows.length - 1].id)
      else setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const running = windows.map((w) => w.id).filter((id): id is DockAppId => !isDesktopItem(id))
  const frontId = windows[windows.length - 1]?.id

  function renderWindow(w: OpenWin, i: number) {
    const common = {
      id: w.id,
      z: 10 + i,
      front: w.id === frontId && !mission,
      origin: w.origin,
      cascade: w.cascade,
      onFocus: () => focusWindow(w.id),
      onClose: () => closeWindow(w.id),
    }
    if (isProduct(w.id)) {
      const p = osProduct(w.id)
      return (
        <OsWindow key={w.id} {...common} title={p.name} icon={<img src={p.icon} alt="" width={32} height={32} />} width={1050} top={277} className="os-win-product">
          <ProductContent product={p} />
        </OsWindow>
      )
    }
    if (w.id === 'stake') {
      return (
        <OsWindow
          key={w.id}
          {...common}
          title="Stake"
          icon={
            <span className="os-win-tile">
              <img src="/os/stake-icon.svg" alt="" width={14} height={15} />
            </span>
          }
          width={entry ? 720 : 1180}
          height={entry ? 760 : 760}
          className="os-win-app os-win-stake"
          accessory={<span className="os-demo-badge">Demo data</span>}
        >
          <div className="portal-window-body">
            {stakeOpen && entry ? (
              <StakeEntry
                connecting={wallet === 'connecting'}
                restricted={screen === 'stake-restricted'}
                onHome={() => onGo('workspace')}
                onConnect={onConnectWallet}
              />
            ) : null}
            {stakeOpen && !entry ? (
              <Stake screen={screen as StakeScreenId} navigationSource={navigationSource} onGo={onGo} onReset={onResetDemo} />
            ) : null}
          </div>
        </OsWindow>
      )
    }
    if (w.id === 'earn') {
      return (
        <OsWindow key={w.id} {...common} title="Earn" icon={<img src="/os/button-earn.svg" alt="" width={32} height={32} />} width={760} height={520} className="os-win-app">
          <div className="os-earn-body" />
        </OsWindow>
      )
    }
    const meta = WINDOW_META[w.id]
    return (
      <OsWindow
        key={w.id}
        {...common}
        title={meta.title}
        icon={
          w.id === 'readme' ? (
            <img src="/os/readme-title-icon.svg" alt="" width={40} height={48} className="os-win-file-icon" />
          ) : (
            <img src="/os/folder-front.svg" alt="" width={32} height={16} className="os-win-folder-icon" />
          )
        }
        width={meta.width}
        top={meta.top}
      >
        {w.id === 'readme' ? <ReadmeContent /> : <FolderContent />}
      </OsWindow>
    )
  }

  return (
    <div
      className="os"
      onPointerDown={(e) => {
        // A click anywhere but on a desktop icon clears the selection.
        if (!(e.target as Element).closest('.os-icon')) setSelected(null)
      }}
    >
      <div className="os-wallpaper" aria-hidden="true" />
      <h1 className="sr-only">XBorg</h1>

      <Notifications onOpen={(id) => openWindow(id)} />
      <XbgWidget wallet={wallet} onWallet={openStake} />

      {ICONS.map((icon) => {
        const m = moved[icon.kind] ?? { x: 0, y: 0 }
        const p = icon.position
        const position: CSSProperties = {
          left: p.left !== undefined ? `calc(${p.left}px + ${m.x}px)` : undefined,
          top: p.top !== undefined ? `calc(${p.top}px + ${m.y}px)` : undefined,
          right: p.right !== undefined ? `calc(${p.right}px - ${m.x}px)` : undefined,
          bottom: p.bottom !== undefined ? `calc(${p.bottom}px - ${m.y}px)` : undefined,
        }
        return (
          <DesktopIcon
            key={icon.kind}
            kind={icon.kind}
            label={icon.label}
            position={position}
            selected={selected === icon.kind}
            onSelect={() => setSelected(icon.kind)}
            onBlur={() => setSelected((cur) => (cur === icon.kind ? null : cur))}
            onOpen={() => openWindow(icon.kind)}
            onMove={(dx, dy) => setMoved((all) => ({ ...all, [icon.kind]: { x: m.x + dx, y: m.y + dy } }))}
          />
        )
      })}

      <AnimatePresence>{windows.map(renderWindow)}</AnimatePresence>

      <AnimatePresence>
        {mission ? <MissionControl onOpen={(id) => openWindow(id)} onClose={() => setMission(false)} /> : null}
      </AnimatePresence>

      <OsDock running={running} missionOpen={mission} onAll={() => setMission((m) => !m)} onOpen={openApp} />
      <Suspense fallback={null}>
        <Cursor3D />
      </Suspense>
    </div>
  )
}
