import { AnimatePresence } from 'motion/react'
import { Suspense, lazy, useEffect, useState, type CSSProperties } from 'react'
import type { DockAppId } from '../components/Dock'
import { isStakeScreen, type NavigationSource, type ProductId, type ScreenId } from '../screens'
import type { WalletState } from '../wallet'
import { ClientsContent, FolderContent, PreferencesContent, ProductContent, ReadmeContent, StakeContent } from './Contents'
import { OS_WALLPAPERS, STAKE_PAGE, osProduct, type OsWallpaper } from './data'
import MessagesApp from './MessagesApp'
import MenuBar from './MenuBar'
import WallpaperWave from './WallpaperWave'
import DesktopIcon, { type DesktopItemKind } from './DesktopIcon'
import MissionControl from './MissionControl'
import Notifications from './Notifications'
import OsDock from './OsDock'
import OsWindow, { type OsWindowOrigin } from './OsWindow'
import XbgWidget from './XbgWidget'
import './os.css'

const Cursor3D = lazy(() => import('./Cursor3D'))

type AppWin = 'stake' | 'earn' | 'prefs' | 'chat'
type WinId = ProductId | DesktopItemKind | AppWin
type OpenWin = { id: WinId; origin: OsWindowOrigin; cascade: number }

const PRODUCT_IDS: ProductId[] = ['propr', 'fanbase', 'trigr']
const isProduct = (id: string): id is ProductId => (PRODUCT_IDS as string[]).includes(id)
const isDesktopItem = (id: string): id is DesktopItemKind => id === 'readme' || id === 'docs' || id === 'changelog'

const ICONS: { kind: DesktopItemKind; label: string; position: CSSProperties }[] = [
  { kind: 'docs', label: 'Clients', position: { left: 82, top: 558 } },
  { kind: 'readme', label: 'about_us.txt', position: { right: 81, bottom: 143 } },
]

const WINDOW_META: Record<DesktopItemKind, { title: string; width: number; top?: number }> = {
  readme: { title: 'about_us.txt', width: 760, top: 150 },
  docs: { title: 'Clients', width: 760, top: 120 },
  changelog: { title: 'Changelog', width: 560 },
}

// Where a window grows from: its dock tile, or its desktop icon.
const WALLPAPER_KEY = 'xborg-os-wallpaper'

function savedWallpaper(): string {
  try {
    const id = window.localStorage.getItem(WALLPAPER_KEY)
    if (id && OS_WALLPAPERS.some((w) => w.id === id)) return id
  } catch {
    // Storage blocked: use the default.
  }
  return OS_WALLPAPERS[0].id
}

function originOf(id: WinId): OsWindowOrigin {
  const el = isDesktopItem(id)
    ? document.querySelector<HTMLElement>(`[data-desktop-item="${id}"]`)
    : id === 'prefs'
      ? document.querySelector<HTMLElement>('.os-menubar-logo')
      : document.querySelector<HTMLElement>(`[data-dock="${id}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export default function Desktop({
  screen,
  wallet,
  onGo,
}: {
  screen: ScreenId
  navigationSource?: NavigationSource
  wallet: WalletState
  onGo: (id: ScreenId) => void
  onConnectWallet?: () => void
  onResetDemo?: () => void
}) {
  // Messages is already open when the desktop appears, on every screen size.
  const [windows, setWindows] = useState<OpenWin[]>([{ id: 'chat', origin: null, cascade: 0 }])
  const [mission, setMission] = useState(false)
  const [selected, setSelected] = useState<DesktopItemKind | null>(null)
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({})
  const [wallpaper, setWallpaper] = useState(savedWallpaper)
  const stakeOpen = isStakeScreen(screen)
  const paper = OS_WALLPAPERS.find((w) => w.id === wallpaper) ?? OS_WALLPAPERS[0]

  function chooseWallpaper(w: OsWallpaper) {
    setWallpaper(w.id)
    try {
      window.localStorage.setItem(WALLPAPER_KEY, w.id)
    } catch {
      // Not remembered, still applied.
    }
  }

  function openWindow(id: WinId) {
    setMission(false)
    setWindows((list) => {
      const existing = list.find((w) => w.id === id)
      const rest = list.filter((w) => w.id !== id)
      return [...rest, existing ?? { id, origin: originOf(id), cascade: rest.length % 6 }]
    })
  }

  function closeWindow(id: WinId) {
    if (id === 'stake' && stakeOpen) onGo('workspace')
    else setWindows((list) => list.filter((w) => w.id !== id))
  }

  function focusWindow(id: WinId) {
    setWindows((list) => (list[list.length - 1]?.id === id ? list : [...list.filter((w) => w.id !== id), list.find((w) => w.id === id)!]))
  }

  // Stake is the live xborg.com/earn page in a window.
  function openStake() {
    openWindow('stake')
  }

  function openApp(id: DockAppId) {
    if (id === 'stake') openStake()
    else if (id !== 'earn') openWindow(id)
  }

  // Dock: a click opens the app, brings it to the front if another window
  // covers it, and closes it when it is already the window in front.
  function toggleWindow(id: WinId, open: () => void) {
    const top = windows[windows.length - 1]?.id
    if (top === id && !mission) closeWindow(id)
    else open()
  }
  function toggleApp(id: DockAppId) {
    toggleWindow(id, () => openApp(id))
  }

  // Review links such as #propr open that window on the desktop.
  useEffect(() => {
    if (isProduct(screen)) openWindow(screen)
  }, [screen])

  // Links such as #stake open that window too.
  useEffect(() => {
    for (const [id, open] of [
      ['stake', stakeOpen],
    ] as const) {
      setWindows((list) => {
        const has = list.some((w) => w.id === id)
        if (open && !has) return [...list, { id, origin: originOf(id), cascade: list.length % 6 }]
        if (!open && has) return list.filter((w) => w.id !== id)
        return list
      })
    }
  }, [stakeOpen])

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

  const running = windows.map((w) => w.id).filter((id): id is DockAppId => !isDesktopItem(id) && id !== 'prefs' && id !== 'chat')
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
          width={1180}
          height={820}
          className="os-win-app os-win-stake"
          accessory={
            <a className="os-win-btn os-win-open-out" href={STAKE_PAGE} target="_blank" rel="noreferrer" aria-label="Open Stake in a new tab" title="Open in a new tab">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 16 16 8" />
                <path d="M9 8h7v7" />
              </svg>
            </a>
          }
        >
          <StakeContent />
        </OsWindow>
      )
    }
    if (w.id === 'chat') {
      return (
        <OsWindow
          key={w.id}
          {...common}
          title="Messages"
          icon={
            <img src="/os/button-messages.svg" alt="" width={32} height={32} />
          }
          width={640}
          height={580}
          top={170}
          className="os-win-app os-win-chat"
        >
          <MessagesApp onOpenApp={openApp} />
        </OsWindow>
      )
    }
    if (w.id === 'prefs') {
      return (
        <OsWindow
          key={w.id}
          {...common}
          title="Preferences"
          icon={
            <span className="os-win-tile">
              <img src="/os/stake-icon.svg" alt="" width={14} height={15} />
            </span>
          }
          width={640}
          className="os-win-app os-win-prefs"
        >
          <PreferencesContent value={paper.id} onChange={chooseWallpaper} />
        </OsWindow>
      )
    }
    if (w.id === 'earn') return null
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
        {w.id === 'readme' ? <ReadmeContent /> : w.id === 'docs' ? <ClientsContent /> : <FolderContent />}
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
      <div
        className="os-wallpaper"
        aria-hidden="true"
        style={
          {
            '--os-wallpaper': `url('${paper.src}')`,
            '--os-wallpaper-small': `url('${paper.small}')`,
            '--os-wallpaper-opacity': paper.opacity,
          } as CSSProperties
        }
      >
        <WallpaperWave src={paper.src} small={paper.small} opacity={paper.opacity} />
      </div>
      <h1 className="sr-only">XBorg</h1>

      <MenuBar
        onOpenApp={openApp}
        onAbout={() => openWindow('readme')}
        onClients={() => openWindow('docs')}
        onMessages={() => openWindow('chat')}
        onPreferences={() => openWindow('prefs')}
      />

      <Notifications onOpen={(id) => openWindow(id)} />
      <XbgWidget wallet={wallet} onStake={openStake} />

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

      <OsDock
        running={running}
        missionOpen={mission}
        messagesOpen={windows.some((w) => w.id === 'chat')}
        onAll={() => setMission((m) => !m)}
        onOpen={toggleApp}
        onMessages={() => toggleWindow('chat', () => openWindow('chat'))}
      />
      <Suspense fallback={null}>
        <Cursor3D />
      </Suspense>
    </div>
  )
}
