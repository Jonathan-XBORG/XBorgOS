import { useEffect, useState, type ReactNode } from 'react'
import { hrefFor } from '../screens'
import { IconArrow, IconCopy, IconDisconnect, IconMark, IconOpen, IconPortal } from './Icons'
import { DEMO_WALLET, SEASON, formatMultiplier, formatXbg } from './stake/config'
import { createStakeState, currentEstimate, stakeMultiplier } from './stake/demoState'
import ProductArtwork from './ProductArtwork'
import WindowControls from './WindowControls'
import { TOKEN_EXCEPTIONS } from '../tokenExceptions'
import { WALLET_MENU } from '../wallet'

const COLOUR_TOKENS = [
  ['--x-canvas', 'Canvas'],
  ['--x-surface-1', 'Surface 1, windows'],
  ['--x-surface-2', 'Surface 2, cards'],
  ['--x-surface-3', 'Surface 3, hover'],
  ['--x-bubble-bg', 'Bubble'],
  ['--x-ink-1', 'Ink 1'],
  ['--x-ink-2', 'Ink 2'],
  ['--x-ink-3', 'Ink 3'],
  ['--x-accent', 'Accent'],
  ['--x-success', 'Success'],
  ['--x-warning', 'Warning'],
  ['--x-error', 'Error'],
] as const

const TYPE_TOKENS = [
  ['1', 'Display', 'Mobile opening and Stake visitor view'],
  ['2', 'Heading 1', 'Page titles'],
  ['3', 'Heading 2 and figures', 'Section titles, stat values'],
  ['4', 'Lead', 'Card titles, product lead'],
  ['5', 'Body', 'Bubbles and paragraphs'],
  ['6', 'Small', 'Buttons, secondary text'],
  ['7', 'Label', 'Labels, captions, badges'],
] as const

const SPACE_TOKENS = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16'] as const
const SHADOW_TOKENS = ['--x-shadow-1', '--x-shadow-2', '--x-shadow-3'] as const
const MOTION_TOKENS = [
  ['--x-dur-1', 'Press, hover, colour'],
  ['--x-dur-2', 'Menus, dock, tooltips'],
  ['--x-dur-3', 'Windows open and close'],
] as const

function useTokenValue(name: string) {
  const [value, setValue] = useState('')
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim())
  }, [name])
  return value
}

function Swatch({ name, label }: { name: string; label: string }) {
  const value = useTokenValue(name)
  return (
    <div className="sys-swatch">
      <span className="sys-swatch-chip" style={{ background: `var(${name})` }} />
      <span className="sys-swatch-label">{label}</span>
      <code>{value.length > 28 ? name : value}</code>
    </div>
  )
}

function TypeRow({ step, label, use }: { step: string; label: string; use: string }) {
  const size = useTokenValue(`--x-t${step}`)
  const line = useTokenValue(`--x-l${step}`)
  const display = step === '1' || step === '2' || step === '3'
  return (
    <div className="sys-type-row">
      <span
        className={display ? 'sys-type-sample is-display' : 'sys-type-sample'}
        style={{ fontSize: `var(--x-t${step})`, lineHeight: `var(--x-l${step})` }}
      >
        {label}
      </span>
      <span className="sys-type-meta">
        <code>{`${size} / ${line}`}</code>
        <span>{use}</span>
      </span>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="sys-section">
      <header className="sys-section-head">
        <h2>{title}</h2>
        {note ? <p>{note}</p> : null}
      </header>
      {children}
    </section>
  )
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sys-state">
      <div className="sys-state-stage">{children}</div>
      <span className="sys-state-label">{label}</span>
    </div>
  )
}

const BUTTON_STATES = [
  ['Rest', ''],
  ['Hover', ' is-hover'],
  ['Pressed', ' is-pressed'],
  ['Focus', ' is-focus'],
  ['Disabled', ' is-disabled'],
  ['Loading', ' is-loading'],
] as const

export default function SystemSheet() {
  const home = createStakeState('stake-active')

  return (
    <article className="system" data-screen="system">
      <header className="sys-head">
        <p className="sys-kicker">XBorg design system</p>
        <h1>Design system</h1>
        <p className="sys-lead">
          Direction A, Calm, chosen on 24 September 2026. Soft radius, tonal surfaces, soft layered shadows and one
          glass edge on the main calls to action. Every token and every component in every state, as the handover
          to production.
        </p>
        <nav className="sys-links" aria-label="Related screens">
          <a className="btn btn-secondary btn-sm" href={hrefFor('workspace')}>
            Homepage
          </a>
          <a className="btn btn-secondary btn-sm" href={hrefFor('stake-active')}>
            Stake
          </a>
          <a className="btn btn-quiet btn-sm" href={hrefFor('references')}>
            Mobbin references
          </a>
        </nav>
      </header>

      <>
          <Section title="Colour" note="Six neutrals, one accent. Semantic tones are only ever small dots next to neutral text.">
            <div className="sys-swatches">
              {COLOUR_TOKENS.map(([name, label]) => (
                <Swatch key={name} name={name} label={label} />
              ))}
            </div>
          </Section>

          <Section title="Type" note="Seven sizes, each with a fixed line height. Archivo for display and figures, Geist for text, Geist Mono for addresses.">
            <div className="sys-type">
              {TYPE_TOKENS.map(([step, label, use]) => (
                <TypeRow key={step} step={step} label={label} use={use} />
              ))}
              <div className="sys-type-row">
                <span className="sys-type-sample is-figure">{formatXbg(home.pledged)}</span>
                <span className="sys-type-meta">
                  <code>Tabular figures</code>
                  <span>Every number lines up in columns</span>
                </span>
              </div>
              <div className="sys-type-row">
                <span className="sys-type-sample is-mono">{DEMO_WALLET.address}</span>
                <span className="sys-type-meta">
                  <code>Mono</code>
                  <span>Wallet addresses only, case kept</span>
                </span>
              </div>
            </div>
          </Section>

          <Section title="Spacing, shape, elevation and motion">
            <div className="sys-grid-2">
              <div className="sys-spaces">
                {SPACE_TOKENS.map((step) => (
                  <div key={step} className="sys-space">
                    <span style={{ width: `var(--x-space-${step})` }} />
                    <code>{`space ${step}`}</code>
                  </div>
                ))}
              </div>
              <div className="sys-shapes">
                <State label="Control">
                  <span className="sys-shape is-control" />
                </State>
                <State label="Card">
                  <span className="sys-shape is-card" />
                </State>
                <State label="Window">
                  <span className="sys-shape is-window" />
                </State>
                <State label="X mark">
                  <span className="sys-shape is-mark" />
                </State>
                {SHADOW_TOKENS.map((name, i) => (
                  <State key={name} label={`Elevation ${i + 1}`}>
                    <span className="sys-shape is-card" style={{ boxShadow: `var(${name})` }} />
                  </State>
                ))}
                {MOTION_TOKENS.map(([name, use]) => (
                  <State key={name} label={use}>
                    <code className="sys-motion">{name.replace('--x-dur-', 'duration ')}</code>
                  </State>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Button" note="One family. Primary for the single main action on a screen, secondary for supporting actions, quiet for links.">
            {(['primary', 'secondary', 'quiet'] as const).map((variant) => (
              <div key={variant} className="sys-row">
                <span className="sys-row-label">{variant[0].toUpperCase() + variant.slice(1)}</span>
                {BUTTON_STATES.map(([label, modifier]) => (
                  <State key={label} label={label}>
                    <button
                      type="button"
                      tabIndex={-1}
                      className={`btn btn-${variant}${modifier}`}
                      disabled={label === 'Disabled'}
                    >
                      Stake More
                    </button>
                  </State>
                ))}
              </div>
            ))}
            <div className="sys-row">
              <span className="sys-row-label">Sizes</span>
              <State label="Small, 28">
                <button type="button" tabIndex={-1} className="btn btn-primary btn-sm">
                  Stake More
                </button>
              </State>
              <State label="Medium, 36">
                <button type="button" tabIndex={-1} className="btn btn-primary">
                  Stake More
                </button>
              </State>
              <State label="Large, 44">
                <button type="button" tabIndex={-1} className="btn btn-primary btn-lg">
                  Open Stake
                  <IconArrow />
                </button>
              </State>
            </div>
          </Section>

          <Section title="Wallet control" note="Sized to the menu bar. The connected state opens a menu with Open Stake, Copy address and Disconnect.">
            <div className="sys-row sys-menubar">
              <State label="Disconnected">
                <button type="button" tabIndex={-1} className="btn btn-primary wallet-control">
                  Connect Wallet
                </button>
              </State>
              <State label="Hover">
                <button type="button" tabIndex={-1} className="btn btn-primary wallet-control is-hover">
                  Connect Wallet
                </button>
              </State>
              <State label="Focus">
                <button type="button" tabIndex={-1} className="btn btn-primary wallet-control is-focus">
                  Connect Wallet
                </button>
              </State>
              <State label="Pressed">
                <button type="button" tabIndex={-1} className="btn btn-primary wallet-control is-pressed">
                  Connect Wallet
                </button>
              </State>
              <State label="Connecting">
                <span className="wallet-control is-connecting">
                  <span className="wallet-spinner" aria-hidden="true" />
                  Connect Wallet
                </span>
              </State>
              <State label="Connected">
                <span className="wallet-control is-connected">
                  <span className="wallet-dot" aria-hidden="true" />
                  {DEMO_WALLET.address}
                </span>
              </State>
              <State label="Menu open">
                <span className="sys-menu-anchor">
                  <span className="wallet-control is-connected">
                    <span className="wallet-dot" aria-hidden="true" />
                    {DEMO_WALLET.address}
                  </span>
                  <span className="wallet-menu sys-wallet-menu" role="presentation">
                    <span className="is-active">
                      <IconOpen />
                      {WALLET_MENU.open}
                    </span>
                    <span>
                      <IconCopy />
                      {WALLET_MENU.copy}
                    </span>
                    <span className="wallet-menu-rule" />
                    <span>
                      <IconDisconnect />
                      {WALLET_MENU.disconnect}
                    </span>
                  </span>
                </span>
              </State>
            </div>
          </Section>

          <Section title="Bubble" note="Shrinks to its text, up to 75 percent of the chat on desktop and 85 percent on mobile. Groups share one sender mark. Product names open their window.">
            <div className="sys-chat">
              <section className="beat">
                <div>
                  <p className="beat-label">
                    <span className="beat-index">01</span>
                    {'  '}
                    <span className="beat-name">Who we are</span>
                  </p>
                </div>
                <div className="bubble">
                  You are probably here for <span className="inline-link">Propr</span>,{' '}
                  <span className="inline-link">FanBase</span> or the XBG token.
                </div>
                <div className="bubble">XBorg is an AI startup studio.</div>
                <div className="bubble">We help small teams build and grow software companies.</div>
                <div className="bubble">We never raised from VCs.</div>
              </section>
            </div>
          </Section>

          <Section title="Window chrome" note="One chrome for every window: wordmark title, maximise and close on the right, hairline edge, soft shadow. Drag the title bar to move, any edge or corner to resize, double click to maximise.">
            <div className="sys-window-stage">
              <section className="window window-product sys-window" aria-label="Sample window">
                <div className="window-frame">
                  <div className="window-title">
                    <span className="window-name">PROPR</span>
                    <WindowControls onClose={() => undefined} onMaximise={() => undefined} />
                  </div>
                  <div className="window-body">
                    <p className="sys-window-copy">The crypto prop firm built onchain.</p>
                  </div>
                </div>
              </section>
            </div>
          </Section>

          <Section title="Dock tile" note="Nothing is selected on load. Hover nudges the tile up 3 pixels and brightens it. Only the icon moves, so the dock never changes width. Keyboard focus nudges the whole tile with its ring. A click presses the tile and nothing moves after it.">
            <div className="sys-dock-stage">
              <div className="dock-tray sys-dock">
                <span className="dock-item dock-product">
                  <span className="dock-icon">
                    <ProductArtwork id="propr" />
                  </span>
                  <span className="sys-state-label">Idle</span>
                </span>
                <span className="dock-item dock-product is-hover">
                  <span className="dock-icon">
                    <ProductArtwork id="fanbase" />
                  </span>
                  <span className="dock-label">FanBase</span>
                  <span className="sys-state-label">Hover</span>
                </span>
                <span className="dock-item dock-product is-focus">
                  <span className="dock-icon">
                    <ProductArtwork id="trigr" />
                  </span>
                  <span className="sys-state-label">Focus</span>
                </span>
                <span className="dock-item is-portal is-active">
                  <span className="dock-icon">
                    <span className="xborg-favicon" aria-hidden="true">
                      <IconMark />
                    </span>
                  </span>
                  <span className="dock-dot" aria-hidden="true" />
                  <span className="sys-state-label">Open</span>
                </span>
              </div>
            </div>
          </Section>

          <Section title="Badge" note="One quiet shape. Status reads from a small dot, never from coloured outlines.">
            <div className="sys-row">
              <span className="demo-badge">Demo Data</span>
              <span className="status-badge is-available">Available</span>
              <span className="status-badge is-in-progress">In progress</span>
              <span className="status-badge is-in-review">In review</span>
              <span className="status-badge is-completed">Completed</span>
              <span className="status-badge is-locked">Locked</span>
            </div>
          </Section>

          <Section title="Card and stat row" note="Separation through space and tone. Figures in tabular Archivo with calm labels.">
            <div className="portal-app sys-portal">
              <section className="portal-section season-panel">
                <div className="section-heading-row">
                  <div>
                    <p className="portal-kicker">XBG Rewards</p>
                    <h2>Season {SEASON.number}</h2>
                  </div>
                </div>
                <div className="season-metrics">
                  <div>
                    <span>XBG pledged</span>
                    <strong>{formatXbg(home.pledged)}</strong>
                  </div>
                  <div>
                    <span>Estimated reward</span>
                    <strong>{formatXbg(currentEstimate(home))}</strong>
                  </div>
                  <div>
                    <span>Multiplier</span>
                    <strong>{formatMultiplier(stakeMultiplier(home))}</strong>
                  </div>
                  <div>
                    <span>Time remaining</span>
                    <strong>{SEASON.daysLeft} days</strong>
                  </div>
                </div>
              </section>
              <article className="requirement-card">
                <h3>PROPR challenge</h3>
                <p>Purchase at least one PROPR challenge this season to activate XBG rewards.</p>
                <div className="requirement-actions">
                  <button type="button" tabIndex={-1} className="btn btn-secondary btn-sm">
                    Purchase Challenge
                  </button>
                  <button type="button" tabIndex={-1} className="btn btn-quiet btn-sm">
                    Verify
                  </button>
                </div>
              </article>
            </div>
          </Section>

          <Section title="Input" note="One field style. The unit sits inside the field, the figure is the largest text.">
            <div className="portal-app sys-portal sys-inputs">
              <div className="stake-control">
                <label htmlFor="sys-amount-rest">Amount to pledge</label>
                <div className="amount-field">
                  <input id="sys-amount-rest" type="number" defaultValue={25000} readOnly tabIndex={-1} />
                  <span>XBG</span>
                </div>
              </div>
              <div className="stake-control">
                <label htmlFor="sys-amount-focus">Amount to pledge</label>
                <div className="amount-field is-focus">
                  <input id="sys-amount-focus" type="number" defaultValue={25000} readOnly tabIndex={-1} />
                  <span>XBG</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Attachment" note="Product and Stake cards sit inside the conversation as rich attachments.">
            <div className="sys-chat">
              <div className="portal-panel">
                <span className="product-tile-icon is-portal">
                  <IconPortal />
                </span>
                <p className="portal-panel-line">Stake XBG. Help XBorg grow. Earn monthly rewards.</p>
                <span className="btn-wrap">
                  <button type="button" tabIndex={-1} className="btn btn-primary">
                    Open Stake
                    <IconArrow />
                  </button>
                </span>
              </div>
            </div>
          </Section>

          <Section title="Tabs" note="Stake navigation. The current destination gets a tonal fill, never an outline.">
            <div className="portal-app sys-portal sys-tabs">
              <nav className="portal-tabs" aria-label="Sample tabs">
                {(['Rewards', 'Positions', 'History'] as const).map((label, i) => (
                  <button key={label} type="button" tabIndex={-1} className={i === 0 ? 'is-on' : ''}>
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </Section>

          <Section title="Modal and toast" note="Modals use the window shape and elevation. Toasts sit in the corner and leave on their own.">
            <div className="sys-window-stage sys-modal-stage">
              <div className="portal-app sys-portal">
                <div className="portal-modal sys-modal" role="presentation">
                  <div className="portal-modal-header">
                    <h2>Pledge XBG</h2>
                  </div>
                  <div className="portal-modal-body">
                    <div className="stake-step">
                      <div className="modal-summary-row">
                        <span>Amount to pledge</span>
                        <strong>{formatXbg(home.pledged)}</strong>
                      </div>
                      <button type="button" tabIndex={-1} className="btn btn-primary btn-lg">
                        Sign
                      </button>
                    </div>
                  </div>
                </div>
                <div className="portal-toast sys-toast" role="presentation">
                  <span className="toast-mark" aria-hidden="true">✓</span>
                  Eligibility updated.
                </div>
              </div>
            </div>
          </Section>

          <Section title="Exceptions" note="Style values that do not come from a token, and why. A unit test allows these and nothing else.">
            <ul className="sys-exceptions">
              {TOKEN_EXCEPTIONS.map((exception) => (
                <li key={exception.reason}>{exception.reason}</li>
              ))}
              <li>Window placement keeps a 12px gap from the menu bar, dock and screen edge, set in the window code.</li>
            </ul>
          </Section>
      </>
    </article>
  )
}
