import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ASK_PLACEHOLDER, searchAsk, type AskItem } from '../ask'
import type { DockAppId } from '../components/Dock'
import { IconArrow, IconBack, IconBubble, IconEarn, IconMark } from '../components/Icons'
import { osProduct } from './data'

type Question = Extract<AskItem, { kind: 'question' }>

function AppGlyph({ app }: { app: DockAppId }) {
  if (app === 'propr' || app === 'fanbase' || app === 'trigr') return <img src={osProduct(app).icon} alt="" width={24} height={24} />
  return <span className="os-search-mark">{app === 'earn' ? <IconEarn /> : <IconMark />}</span>
}

// The dock's search field. Same behaviour as the menu bar's Ask field in the
// previous version: suggestions while typing, answers in place, apps open
// their window, arrows and Enter to choose, Escape to step back, ⌘K to focus.
export default function OsSearch({ onOpenApp }: { onOpenApp: (app: DockAppId) => void }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [answer, setAnswer] = useState<Question | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const actionRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => searchAsk(query), [query])
  const questions = results.filter((r) => r.kind === 'question').slice(0, query.trim() ? undefined : 4)
  const apps = results.filter((r) => r.kind === 'app')
  const appsFirst = results[0]?.kind === 'app'
  const ordered = appsFirst ? [...apps, ...questions] : [...questions, ...apps]

  function close(blur: boolean) {
    setOpen(false)
    setAnswer(null)
    setQuery('')
    setActive(0)
    if (blur) inputRef.current?.blur()
  }

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (open) close(true)
        else {
          setOpen(true)
          inputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  useEffect(() => {
    if (answer) actionRef.current?.focus()
  }, [answer])

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function choose(item: AskItem | undefined) {
    if (!item) return
    if (item.kind === 'app') {
      close(true)
      onOpenApp(item.app)
    } else {
      setAnswer(item)
    }
  }

  function runAction() {
    const action = answer?.action
    if (!action || !('app' in action)) return
    close(true)
    onOpenApp(action.app)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (answer) {
        setAnswer(null)
        inputRef.current?.focus()
      } else close(true)
      return
    }
    if (answer) {
      if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
        event.preventDefault()
        setAnswer(null)
        inputRef.current?.focus()
      }
      return
    }
    if (!open) setOpen(true)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (ordered.length ? (i + step + ordered.length) % ordered.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(ordered[active])
    }
  }

  const optionId = (item: AskItem) => `os-ask-${item.id}`
  const renderOption = (item: AskItem) => {
    const index = ordered.indexOf(item)
    return (
      <div
        key={item.id}
        id={optionId(item)}
        role="option"
        aria-selected={index === active}
        className="os-search-option"
        onPointerMove={() => setActive(index)}
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => choose(item)}
      >
        <span className="os-search-glyph" aria-hidden="true">
          {item.kind === 'app' ? <AppGlyph app={item.app} /> : <IconBubble />}
        </span>
        <span className="os-search-title">{item.title}</span>
        <span className="os-search-hint">{item.kind === 'app' ? 'Open' : 'Ask'}</span>
      </div>
    )
  }
  const group = (label: string, items: AskItem[]) =>
    items.length ? (
      <div role="group" aria-label={label}>
        <span className="os-search-group" aria-hidden="true">
          {label}
        </span>
        {items.map(renderOption)}
      </div>
    ) : null

  return (
    <div className="os-search" ref={rootRef} onKeyDown={onKeyDown}>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="os-search-panel"
            role="dialog"
            aria-label="Ask XBorg"
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {answer ? (
              <div className="os-search-answer">
                <div className="os-search-answer-head">
                  <button type="button" className="os-search-back" aria-label="Back to questions" onClick={() => setAnswer(null)}>
                    <IconBack />
                  </button>
                  <span className="os-search-answer-title">{answer.title}</span>
                </div>
                <div className="os-search-bubbles">
                  {answer.answer.map((line, i) => (
                    <motion.p
                      key={line}
                      className="os-search-bubble"
                      initial={reduce ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.06 + i * 0.12 }}
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
                {answer.action ? (
                  'app' in answer.action ? (
                    <button
                      ref={(el) => {
                        actionRef.current = el
                      }}
                      type="button"
                      className="os-search-action"
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
                      className="os-search-action"
                      href={answer.action.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => close(true)}
                    >
                      {answer.action.label}
                      <IconArrow />
                    </a>
                  )
                ) : null}
              </div>
            ) : (
              <div className="os-search-list" id="os-ask-list" role="listbox" aria-label="Suggestions" ref={listRef}>
                {ordered.length ? (
                  <>
                    {appsFirst ? group('Apps', apps) : group('Questions', questions)}
                    {appsFirst ? group('Questions', questions) : group('Apps', apps)}
                  </>
                ) : (
                  <p className="os-search-empty">Nothing on that yet. Try Stake, Propr or rewards.</p>
                )}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <label className="os-search-field">
        <img src="/os/search-icon-dark.svg" alt="" width={14} height={14} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="os-ask-list"
          aria-autocomplete="list"
          aria-activedescendant={open && !answer && ordered[active] ? optionId(ordered[active]) : undefined}
          aria-label="Ask XBorg"
          placeholder={ASK_PLACEHOLDER}
          value={query}
          spellCheck={false}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setAnswer(null)
            setOpen(true)
          }}
        />
      </label>
    </div>
  )
}
