import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ASK_PLACEHOLDER, searchAsk, type AskItem } from '../ask'
import type { DockAppId } from './Dock'
import { IconArrow, IconBack, IconBubble, IconEarn, IconMark, IconSearch } from './Icons'
import ProductArtwork from './ProductArtwork'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

function AppGlyph({ app }: { app: DockAppId }) {
  if (app === 'propr' || app === 'fanbase' || app === 'trigr') return <ProductArtwork id={app} />
  return app === 'earn' ? <IconEarn /> : <IconMark />
}

// The menu bar's one field. ⌘K (Ctrl K elsewhere) opens it from anywhere.
// Questions answer in place, in the chat's own voice; apps open their window.
export default function AskBar({ onOpenApp }: { onOpenApp: (app: DockAppId) => void }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [answer, setAnswer] = useState<Extract<AskItem, { kind: 'question' }> | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const actionRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => searchAsk(query), [query])
  // An empty field opens short: the four questions people ask most, then the apps.
  const questions = results.filter((r) => r.kind === 'question').slice(0, query.trim() ? undefined : 4)
  const apps = results.filter((r) => r.kind === 'app')
  // A name typed exactly puts its app first, so Enter opens it.
  const appsFirst = results[0]?.kind === 'app'
  const ordered = appsFirst ? [...apps, ...questions] : [...questions, ...apps]

  function close(refocus: boolean) {
    setOpen(false)
    setAnswer(null)
    setQuery('')
    setActive(0)
    if (refocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (open) close(true)
        else setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !anchorRef.current?.contains(event.target)) close(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (answer) (actionRef.current ?? inputRef.current)?.focus()
    else inputRef.current?.focus()
  }, [open, answer])

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function choose(item: AskItem | undefined) {
    if (!item) return
    if (item.kind === 'app') {
      close(false)
      onOpenApp(item.app)
    } else {
      setAnswer(item)
    }
  }

  function runAction() {
    const action = answer?.action
    if (!action || !('app' in action)) return
    close(false)
    onOpenApp(action.app)
  }

  function onPanelKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      // Stop here, so a window behind the menu bar does not close as well.
      event.preventDefault()
      event.stopPropagation()
      if (answer) setAnswer(null)
      else close(true)
      return
    }
    if (answer) {
      if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
        event.preventDefault()
        setAnswer(null)
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (ordered.length ? (i + step + ordered.length) % ordered.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(ordered[active])
    }
  }

  const pop = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, transform: 'translate(-50%, -6px) scale(0.98)' },
        animate: { opacity: 1, transform: 'translate(-50%, 0px) scale(1)' },
        exit: { opacity: 0, transform: 'translate(-50%, -6px) scale(0.98)' },
        transition: { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] as const },
      }

  const optionId = (item: AskItem) => `ask-${item.id}`
  const renderOption = (item: AskItem) => {
    const index = ordered.indexOf(item)
    return (
      <div
        key={item.id}
        id={optionId(item)}
        role="option"
        aria-selected={index === active}
        className="ask-option"
        onPointerMove={() => setActive(index)}
        onClick={() => choose(item)}
      >
        <span className="ask-option-glyph" aria-hidden="true">
          {item.kind === 'app' ? <AppGlyph app={item.app} /> : <IconBubble />}
        </span>
        <span className="ask-option-title">{item.title}</span>
        <span className="ask-option-hint">{item.kind === 'app' ? 'Open' : 'Ask'}</span>
      </div>
    )
  }

  const questionsGroup = questions.length ? (
    <div role="group" aria-label="Questions">
      <span className="ask-group" aria-hidden="true">
        Questions
      </span>
      {questions.map(renderOption)}
    </div>
  ) : null
  const appsGroup = apps.length ? (
    <div role="group" aria-label="Apps">
      <span className="ask-group" aria-hidden="true">
        Apps
      </span>
      {apps.map(renderOption)}
    </div>
  ) : null

  return (
    <div className="ask" ref={anchorRef}>
      <button
        ref={triggerRef}
        type="button"
        className="ask-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close(true) : setOpen(true))}
      >
        <IconSearch />
        <span className="ask-trigger-label">Ask XBorg</span>
        <kbd className="ask-kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div className="ask-panel" role="dialog" aria-label="Ask XBorg" onKeyDown={onPanelKey} {...pop}>
            {answer ? (
              <div className="ask-answer">
                <div className="ask-answer-head">
                  <button type="button" className="ask-back" aria-label="Back to questions" onClick={() => setAnswer(null)}>
                    <IconBack />
                  </button>
                  <span className="ask-answer-title">{answer.title}</span>
                </div>
                <div className="ask-answer-body">
                  <span className="ask-avatar" aria-hidden="true">
                    <IconMark />
                  </span>
                  <div className="ask-bubbles">
                    {answer.answer.map((line, i) => (
                      <motion.p
                        key={line}
                        className="ask-bubble"
                        initial={reduce ? false : { opacity: 0, transform: 'translateY(4px)' }}
                        animate={{ opacity: 1, transform: 'translateY(0px)' }}
                        transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.06 + i * 0.12 }}
                      >
                        {line}
                      </motion.p>
                    ))}
                  </div>
                </div>
                {answer.action ? (
                  'app' in answer.action ? (
                    <button
                      ref={(el) => {
                        actionRef.current = el
                      }}
                      type="button"
                      className="btn btn-primary ask-action"
                      onClick={runAction}
                    >
                      {answer.action.label}
                      <IconArrow />
                    </button>
                  ) : (
                    <a
                      ref={(el) => {
                        actionRef.current = el
                      }}
                      className="btn btn-primary ask-action"
                      href={answer.action.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => close(false)}
                    >
                      {answer.action.label}
                      <IconArrow />
                    </a>
                  )
                ) : null}
              </div>
            ) : (
              <>
                <div className="ask-field">
                  <IconSearch />
                  <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="ask-list"
                    aria-autocomplete="list"
                    aria-activedescendant={ordered[active] ? optionId(ordered[active]) : undefined}
                    aria-label="Ask XBorg"
                    placeholder={ASK_PLACEHOLDER}
                    value={query}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setActive(0)
                    }}
                  />
                  <kbd className="ask-kbd">esc</kbd>
                </div>
                <div className="ask-list" id="ask-list" role="listbox" aria-label="Suggestions" ref={listRef}>
                  {ordered.length ? (
                    <>
                      {appsFirst ? appsGroup : questionsGroup}
                      {appsFirst ? questionsGroup : appsGroup}
                    </>
                  ) : (
                    <p className="ask-empty">Nothing on that yet. Try Stake, Propr or rewards.</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
