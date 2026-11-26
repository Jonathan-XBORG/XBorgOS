import { AnimatePresence, motion } from 'motion/react'
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import type { DockAppId } from '../components/Dock'
import { isStakeScreen, type NavigationSource, type ProductId, type ScreenId } from '../screens'
import type { WalletState } from '../wallet'
import Boot from './Boot'
import { beep } from './chatSound'
import ContextMenu, { type MenuItem } from './ContextMenu'
import {
  AboutOsContent,
  ClientsContent,
  FolderContent,
  InfoContent,
  PreferencesContent,
  ProductContent,
  ReadmeContent,
  SecretContent,
  StakeContent,
} from './Contents'
import { useKonami } from './konami'
import LiveWallpaper from './LiveWallpaper'
import LogoWallpaper from './LogoWallpaper'
import { formatPrice } from './XbgChart'
import { getMarket } from './xbgMarket'
import { APP_INFO, OS_WALLPAPERS, STAKE_PAGE, XBG_CHART_URL, XBG_CONTRACTS, osProduct, type OsWallpaper } from './data'
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

type AppWin = 'stake' | 'earn' | 'prefs' | 'chat' | 'about'
type InfoWin = `info-${string}`
type WinId = ProductId | DesktopItemKind | AppWin | InfoWin
type OpenWin = { id: WinId; origin: OsWindowOrigin; cascade: number }

const PRODUCT_IDS: ProductId[] = ['propr', 'fanbase', 'trigr']
const isProduct = (id: string): id is ProductId => (PRODUCT_IDS as string[]).includes(id)
const isDesktopItem = (id: string): id is DesktopItemKind => id === 'readme' || id === 'docs' || id === 'changelog' || id === 'secret'
const isInfo = (id: string): id is InfoWin => id.startsWith('info-')

const ICONS: {
  kind: DesktopItemKind
  label: string
  position: CSSProperties
}[] = [
  // Hidden for now; put this line back to show the Clients folder again.
  // { kind: 'docs', label: 'Clients', position: { left: 82, top: 558 } },
  {
    kind: 'readme',
    label: 'about_us.txt',
    position: { right: 81, bottom: 143 },
  },
]
// Shown with "Show Hidden Files" in the desktop's right click menu.
const SECRET_ICON = {
  kind: 'secret' as const,
  label: '.secret',
  position: { right: 81, bottom: 282 } as CSSProperties,
}

// Deep links: ?open=propr opens that window. Copy Link writes these.
const OPEN_PARAM: Record<string, WinId> = {
  propr: 'propr',
  fanbase: 'fanbase',
  trigr: 'trigr',
  stake: 'stake',
  messages: 'chat',
  about: 'readme',
  clients: 'docs',
  preferences: 'prefs',
  secret: 'secret',
}
const paramFor = (id: string) => Object.keys(OPEN_PARAM).find((k) => OPEN_PARAM[k] === id) ?? id

const NAMES: Record<string, string> = {
  propr: 'Propr',
  fanbase: 'FanBase',
  trigr: 'Trigr',
  stake: 'Stake',
  chat: 'Messages',
  readme: 'about_us.txt',
  docs: 'Clients',
  secret: '.secret',
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

const WINDOW_META: Record<DesktopItemKind, { title: string; width: number; top?: number }> = {
  readme: { title: 'about_us.txt', width: 760, top: 150 },
  docs: { title: 'Clients', width: 760, top: 120 },
  changelog: { title: 'Changelog', width: 560 },
  secret: { title: '.secret', width: 420, top: 260 },
}

// Where a window grows from: its dock tile, or its desktop icon.
// The chosen wallpaper is remembered; XBorg 3D is the default.
const WALLPAPER_KEY = 'xborg-os-v2-wallpaper-2'

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
  const stakeOpen = isStakeScreen(screen)
  const [wallpaper, setWallpaper] = useState(savedWallpaper)
  const paper = OS_WALLPAPERS.find((w) => w.id === wallpaper) ?? OS_WALLPAPERS[0]
  const [booted, setBooted] = useState(false)
  const [menu, setMenu] = useState<{
    x: number
    y: number
    items: MenuItem[]
  } | null>(null)
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [tidying, setTidying] = useState(false)
  const [notifKey, setNotifKey] = useState(0)
  const [crt, setCrt] = useState(false)
  const closeMenu = useCallback(() => setMenu(null), [])

  function say(text: string) {
    setToast((t) => ({ text, n: (t?.n ?? 0) + 1 }))
  }
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(t)
  }, [toast])

  // Konami code: the whole OS turns into a green phosphor CRT, and back.
  useKonami(() => {
    setCrt((on) => {
      beep(on ? 'off' : 'on')
      say(on ? 'CRT mode off' : 'CRT mode on')
      return !on
    })
  })

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

  // ?open=propr (from Copy Link) opens that window once the desktop is up.
  useEffect(() => {
    if (!booted) return
    const want = new URLSearchParams(window.location.search).get('open')
    const id = want ? OPEN_PARAM[want.toLowerCase()] : undefined
    if (!id) return
    if (id === 'secret') setShowHidden(true)
    openWindow(id)
  }, [booted])

  // Review links such as #propr open that window on the desktop.
  useEffect(() => {
    if (isProduct(screen)) openWindow(screen)
  }, [screen])

  // Links such as #stake open that window too.
  useEffect(() => {
    for (const [id, open] of [['stake', stakeOpen]] as const) {
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
      if (e.key !== 'Escape' || e.defaultPrevented || menu) return
      if (document.querySelector('.portal-modal-backdrop')) return
      if (mission) setMission(false)
      else if (windows.length) closeWindow(windows[windows.length - 1].id)
      else setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const running = windows
    .map((w) => w.id)
    .filter((id): id is DockAppId => id === 'propr' || id === 'fanbase' || id === 'trigr' || id === 'stake')
  const frontId = windows[windows.length - 1]?.id

  // ---------- Right click menus ----------

  function openTarget(id: string) {
    if (id === 'stake') openStake()
    else openWindow(id as WinId)
  }

  async function copyLink(id: string) {
    const url = `${window.location.origin}${window.location.pathname}?open=${paramFor(id)}`
    say((await copyText(url)) ? 'Link copied' : 'Could not copy the link')
  }

  function cleanUp() {
    setTidying(true)
    setMoved({})
    setNotifKey((k) => k + 1)
    window.setTimeout(() => setTidying(false), 700)
  }

  function itemMenu(id: string): MenuItem[] {
    return [
      { label: 'Open', shortcut: '⌘O', onSelect: () => openTarget(id) },
      {
        label: 'Get Info',
        shortcut: '⌘I',
        onSelect: () => openWindow(`info-${id}`),
      },
      { type: 'separator' },
      { label: 'Copy Link', shortcut: '⌘C', onSelect: () => copyLink(id) },
    ]
  }

  function desktopMenu(): MenuItem[] {
    return [
      {
        label: 'Change Wallpaper',
        submenu: OS_WALLPAPERS.map((w) => ({
          label: w.name,
          checked: w.id === paper.id,
          onSelect: () => chooseWallpaper(w),
        })),
      },
      { label: 'Clean Up', onSelect: cleanUp },
      { type: 'separator' },
      {
        label: 'Get Info',
        shortcut: '⌘I',
        onSelect: () => openWindow('about'),
      },
      {
        label: showHidden ? 'Hide Hidden Files' : 'Show Hidden Files',
        shortcut: '⇧⌘.',
        onSelect: () => setShowHidden((v) => !v),
      },
    ]
  }

  function widgetMenu(): MenuItem[] {
    const price = getMarket().quote.price
    return [
      {
        label: 'Copy Price',
        shortcut: '⌘C',
        disabled: price === null,
        onSelect: async () => {
          if (price !== null) say((await copyText(formatPrice(price))) ? `Copied ${formatPrice(price)}` : 'Could not copy')
        },
      },
      {
        label: 'Copy Contract Address',
        submenu: XBG_CONTRACTS.map((c) => ({
          label: c.network,
          onSelect: async () => say((await copyText(c.address)) ? `${c.network} address copied` : 'Could not copy'),
        })),
      },
      {
        label: 'Open Chart',
        shortcut: '⌘O',
        onSelect: () => window.open(XBG_CHART_URL, '_blank', 'noopener'),
      },
      { type: 'separator' },
      { label: 'Stake', onSelect: openStake },
    ]
  }

  // Which menu belongs where the visitor right clicked (or long pressed).
  function menuFor(target: Element): MenuItem[] | null {
    if (target.closest('.os-ctx')) return null
    const icon = target.closest<HTMLElement>('[data-desktop-item]')
    if (icon) {
      const kind = icon.dataset.desktopItem as DesktopItemKind
      setSelected(kind)
      return itemMenu(kind)
    }
    const dock = target.closest<HTMLElement>('[data-dock]')
    if (dock) {
      const id = dock.dataset.dock!
      if (id === 'all') return [{ label: 'Show All Apps', onSelect: () => setMission(true) }]
      return itemMenu(id)
    }
    if (target.closest('.os-widget')) return widgetMenu()
    if (target.closest('.os-win, .os-menubar, .os-dock, .os-notifs, .os-mc, .os-boot')) return null
    return desktopMenu()
  }

  function onContextMenu(e: ReactMouseEvent) {
    // Android fires contextmenu after our own long press: keep one menu.
    if (performance.now() - longPress.current.fired < 800) {
      e.preventDefault()
      return
    }
    const items = menuFor(e.target as Element)
    if (!items) return
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, items })
  }

  // Touch screens: a long press opens the same menus.
  const longPress = useRef<{
    timer: number
    x: number
    y: number
    fired: number
  }>({ timer: 0, x: 0, y: 0, fired: -1e9 })
  function onTouchDown(e: ReactPointerEvent) {
    if (e.pointerType !== 'touch') return
    const lp = longPress.current
    window.clearTimeout(lp.timer)
    lp.x = e.clientX
    lp.y = e.clientY
    const target = e.target as Element
    lp.timer = window.setTimeout(() => {
      const items = menuFor(target)
      if (!items) return
      lp.fired = performance.now()
      navigator.vibrate?.(10)
      setMenu({ x: lp.x, y: lp.y, items })
    }, 520)
  }
  function onTouchMove(e: ReactPointerEvent) {
    const lp = longPress.current
    if (e.pointerType === 'touch' && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) window.clearTimeout(lp.timer)
  }
  function onTouchEnd() {
    window.clearTimeout(longPress.current.timer)
  }

  // Keyboard: ⌘I Get Info, ⌘O and ⌘C on a selected icon, ⇧⌘. hidden files.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || menu) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const key = e.key.toLowerCase()
      if (key === 'i' && !e.shiftKey) {
        // Get Info: the selected icon, else the OS itself.
        e.preventDefault()
        openWindow(selected ? `info-${selected}` : 'about')
      } else if (key === 'o' && selected && !e.shiftKey) {
        e.preventDefault()
        openTarget(selected)
      } else if (key === 'c' && selected && !e.shiftKey && !window.getSelection()?.toString()) {
        e.preventDefault()
        copyLink(selected)
      } else if (e.shiftKey && (e.key === '.' || e.key === '>')) {
        e.preventDefault()
        setShowHidden((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

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
        <OsWindow
          key={w.id}
          {...common}
          title={p.name}
          icon={<img src={p.icon} alt="" width={32} height={32} />}
          width={1050}
          top={277}
          className="os-win-product"
        >
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
              <img src="/V2/os/stake-icon.svg" alt="" width={14} height={15} />
            </span>
          }
          width={1180}
          height={820}
          className="os-win-app os-win-stake"
          accessory={
            <a
              className="os-win-btn os-win-open-out"
              href={STAKE_PAGE}
              target="_blank"
              rel="noreferrer"
              aria-label="Open Stake in a new tab"
              title="Open in a new tab"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
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
            // Same tile as the dock icon: dark glass, white bubble.
            <span className="os-win-tile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M12 3C6.48 3 2 6.94 2 11.8c0 2.47 1.17 4.7 3.05 6.3L4.3 21.4a.5.5 0 0 0 .7.56l3.9-1.8c.98.25 2.02.38 3.1.38 5.52 0 10-3.94 10-8.8S17.52 3 12 3Z" />
              </svg>
            </span>
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
    if (w.id === 'about') {
      return (
        <OsWindow
          key={w.id}
          {...common}
          title="About this OS"
          noFull
          icon={<XMark />}
          width={420}
          top={150}
          className="os-win-app os-win-info"
        >
          <AboutOsContent />
        </OsWindow>
      )
    }
    if (isInfo(w.id)) {
      const target = w.id.slice(5)
      const info = APP_INFO[target]
      return (
        <OsWindow
          key={w.id}
          {...common}
          title={`${NAMES[target] ?? target} Info`}
          icon={iconFor(target, 32)}
          width={440}
          top={160}
          className="os-win-app os-win-info"
        >
          <InfoContent icon={iconFor(target, 48)} name={NAMES[target] ?? target} kind={info?.kind ?? ''} rows={info?.rows ?? []} />
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
              <img src="/V2/os/stake-icon.svg" alt="" width={14} height={15} />
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
          w.id === 'readme' || w.id === 'secret' ? (
            <img src="/V2/os/readme-title-icon.svg" alt="" width={40} height={48} className="os-win-file-icon" />
          ) : (
            <img src="/V2/os/folder-front.svg" alt="" width={32} height={16} className="os-win-folder-icon" />
          )
        }
        width={meta.width}
        top={meta.top}
      >
        {w.id === 'readme' ? (
          <ReadmeContent />
        ) : w.id === 'docs' ? (
          <ClientsContent />
        ) : w.id === 'secret' ? (
          <SecretContent />
        ) : (
          <FolderContent />
        )}
      </OsWindow>
    )
  }

  const icons = showHidden ? [...ICONS, SECRET_ICON] : ICONS
  // Wallpapers drawn in a canvas rather than from an image.
  const live = paper.id === 'live' || paper.id === 'logo'

  return (
    <div
      className={`os${crt ? ' is-crt' : ''}${tidying ? ' is-tidying' : ''}`}
      onPointerDown={(e) => {
        // A click anywhere but on a desktop icon clears the selection.
        if (!(e.target as Element).closest('.os-icon')) setSelected(null)
        if (crt) beep('click')
        onTouchDown(e)
      }}
      onPointerMove={onTouchMove}
      onPointerUp={onTouchEnd}
      onPointerCancel={onTouchEnd}
      onClickCapture={(e) => {
        // The tap that ends a long press must not also open what is under it.
        if (performance.now() - longPress.current.fired < 700) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      onContextMenu={onContextMenu}
    >
      {/* Changing wallpaper: the new one fades in over the old one, which
          stays put until it is covered. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={paper.id}
          className={`os-wallpaper${live ? ' is-live' : ''}`}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, zIndex: 1 }}
          exit={{ opacity: 0.99, zIndex: 0, transition: { duration: 0.7 } }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={
            live
              ? undefined
              : ({
                  '--os-wallpaper': `url('${paper.src}')`,
                  '--os-wallpaper-small': `url('${paper.small}')`,
                  '--os-wallpaper-opacity': paper.opacity,
                } as CSSProperties)
          }
        >
          {paper.id === 'logo' ? <LogoWallpaper /> : live ? <LiveWallpaper /> : <WallpaperWave src={paper.src} small={paper.small} opacity={paper.opacity} />}
        </motion.div>
      </AnimatePresence>
      <h1 className="sr-only">XBorg</h1>

      {booted ? (
        <>
          <MenuBar
            onOpenApp={openApp}
            onAbout={() => openWindow('readme')}
            onClients={() => openWindow('docs')}
            onPreferences={() => openWindow('prefs')}
            onMessages={() => openWindow('chat')}
          />

          <Notifications key={notifKey} onOpen={(id) => openWindow(id)} />
          <XbgWidget wallet={wallet} onStake={openStake} />

          {icons.map((icon) => {
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
                onMove={(dx, dy) =>
                  setMoved((all) => ({
                    ...all,
                    [icon.kind]: { x: m.x + dx, y: m.y + dy },
                  }))
                }
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
        </>
      ) : null}

      {menu ? <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} /> : null}

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.n}
            className="os-toast"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {toast.text}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {crt ? <div className="os-crt" aria-hidden="true" /> : null}

      <Boot image={live ? '' : paper.small} onDone={() => setBooted(true)} />

      <Suspense fallback={null}>
        <Cursor3D />
      </Suspense>
    </div>
  )
}

function XMark() {
  return (
    <span className="os-win-tile">
      <img src="/V2/os/stake-icon.svg" alt="" width={14} height={15} />
    </span>
  )
}

// The icon shown in Get Info windows.
function iconFor(id: string, size: number): ReactNode {
  if (id === 'propr' || id === 'fanbase' || id === 'trigr') {
    const p = osProduct(id)
    return <img src={size > 32 ? p.dockIcon : p.icon} alt="" width={size} height={size} />
  }
  if (id === 'chat')
    return size > 32 ? (
      <span className="os-win-tile os-info-tile">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M12 3C6.48 3 2 6.94 2 11.8c0 2.47 1.17 4.7 3.05 6.3L4.3 21.4a.5.5 0 0 0 .7.56l3.9-1.8c.98.25 2.02.38 3.1.38 5.52 0 10-3.94 10-8.8S17.52 3 12 3Z" />
        </svg>
      </span>
    ) : (
      <span className="os-win-tile">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M12 3C6.48 3 2 6.94 2 11.8c0 2.47 1.17 4.7 3.05 6.3L4.3 21.4a.5.5 0 0 0 .7.56l3.9-1.8c.98.25 2.02.38 3.1.38 5.52 0 10-3.94 10-8.8S17.52 3 12 3Z" />
        </svg>
      </span>
    )
  if (id === 'readme' || id === 'secret')
    return (
      <img
        src="/V2/os/readme-title-icon.svg"
        alt=""
        width={size * 0.8}
        height={size}
        className={id === 'secret' ? 'is-hidden-file' : undefined}
      />
    )
  if (id === 'docs') return <img src="/V2/os/folder-front.svg" alt="" width={size} height={size / 2} />
  return size > 32 ? (
    <span className="os-win-tile os-info-tile">
      <img src="/V2/os/stake-icon.svg" alt="" width={20} height={22} />
    </span>
  ) : (
    <XMark />
  )
}
