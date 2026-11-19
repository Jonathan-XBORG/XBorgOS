import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { WALLET_ADDRESS, WALLET_BALANCE, WALLET_MENU, type WalletState } from '../wallet'
import AskBar from './AskBar'
import type { DockAppId } from './Dock'
import { IconCheck, IconCopy, IconDisconnect, IconMark, IconOpen } from './Icons'

export default function TopBar({
  appName,
  progress,
  scrolled,
  wallet,
  onConnect,
  onOpenStake,
  onDisconnect,
  onOpenApp,
}: {
  appName: string
  progress: number
  scrolled: boolean
  wallet: WalletState
  onConnect: () => void
  onOpenStake: () => void
  onDisconnect: () => void
  onOpenApp: (app: DockAppId) => void
}) {
  const reduceMotion = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const refocusTrigger = useRef(false)

  useEffect(() => {
    if (wallet !== 'connected') setMenuOpen(false)
    if (!refocusTrigger.current) return
    refocusTrigger.current = false
    // After Disconnect, focus returns to the control unless a window has taken it.
    const active = document.activeElement
    if (!active || active === document.body || anchorRef.current?.contains(active)) triggerRef.current?.focus()
  }, [wallet])

  useEffect(() => {
    if (!menuOpen) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !anchorRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [menuOpen])

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => {
      setCopied(false)
      setMenuOpen(false)
      triggerRef.current?.focus()
    }, 900)
    return () => window.clearTimeout(timeout)
  }, [copied])

  function closeMenu() {
    setMenuOpen(false)
    triggerRef.current?.focus()
  }

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeMenu()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      items[(index + step + items.length) % items.length]?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus()
    } else if (event.key === 'Tab') {
      setMenuOpen(false)
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard?.writeText(WALLET_ADDRESS)
    } catch {
      // Clipboard access can be refused. The demo still confirms the action.
    }
    setCopied(true)
  }

  const fade = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, transform: 'translateY(-4px) scale(0.98)' },
        animate: { opacity: 1, transform: 'translateY(0px) scale(1)' },
        exit: { opacity: 0, transform: 'translateY(-4px) scale(0.98)' },
        transition: { duration: 0.14 },
      }

  return (
    <header className="topbar" data-scrolled={scrolled ? 'true' : 'false'}>
      <span className="progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="topbar-brand">
        {/* The mark names the brand whenever another app is in front. */}
        <span
          className="topbar-mark"
          role={appName === 'XBorg' ? undefined : 'img'}
          aria-label={appName === 'XBorg' ? undefined : 'XBorg'}
          aria-hidden={appName === 'XBorg' ? true : undefined}
        >
          <IconMark />
        </span>
        {/* The app in front names itself, as on a desktop. */}
        <span className="topbar-app" key={appName}>
          {appName}
        </span>
      </div>
      <AskBar onOpenApp={onOpenApp} />
      <div className="topbar-status">
        <div className="wallet-anchor" ref={anchorRef}>
          {wallet === 'connected' ? (
            <button
              ref={triggerRef}
              type="button"
              className="wallet-control is-connected"
              data-focus="wallet-menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Wallet ${WALLET_ADDRESS}`}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="wallet-balance">{WALLET_BALANCE}</span>
              <span className="wallet-address">
                <span className="wallet-dot" aria-hidden="true" />
                {WALLET_ADDRESS}
              </span>
            </button>
          ) : (
            <button
              ref={triggerRef}
              type="button"
              className={`btn btn-primary wallet-control${wallet === 'connecting' ? ' is-connecting' : ''}`}
              data-focus="connect-wallet"
              aria-busy={wallet === 'connecting' || undefined}
              disabled={wallet === 'connecting'}
              onClick={onConnect}
            >
              {wallet === 'connecting' ? <span className="wallet-spinner" aria-hidden="true" /> : null}
              Connect Wallet
            </button>
          )}
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                ref={menuRef}
                className="wallet-menu"
                role="menu"
                aria-label="Wallet"
                onKeyDown={onMenuKey}
                {...fade}
              >
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    setMenuOpen(false)
                    onOpenStake()
                  }}
                >
                  <IconOpen />
                  {WALLET_MENU.open}
                </button>
                <button type="button" role="menuitem" tabIndex={-1} onClick={copyAddress}>
                  {copied ? <IconCheck /> : <IconCopy />}
                  {WALLET_MENU.copy}
                </button>
                <span className="wallet-menu-rule" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    setMenuOpen(false)
                    refocusTrigger.current = true
                    onDisconnect()
                  }}
                >
                  <IconDisconnect />
                  {WALLET_MENU.disconnect}
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
