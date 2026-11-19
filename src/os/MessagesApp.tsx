import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import type { DockAppId } from '../components/Dock'
import { CHAT_CONTACTS, answerFor, type ChatAction, type ChatContact, type ChatMessage } from './messagesData'

type Thread = { shown: ChatMessage[]; pending: ChatMessage[]; picked: string[]; started: boolean }

const FIRST_DELAY = 900
const FOLLOW_UP: ChatMessage = { from: 'them', text: 'Anything else I can help with?' }

const typingTime = (m: ChatMessage) => Math.min(1700, 550 + m.text.length * 16)

// The conversation outlives the window: closing and reopening Messages picks
// up where the visitor left off (for as long as the page stays open).
let saved: Record<string, Thread> | null = null

function emptyThreads(): Record<string, Thread> {
  if (saved) return saved
  return Object.fromEntries(CHAT_CONTACTS.map((c) => [c.id, { shown: [], pending: [], picked: [], started: false }]))
}

function Avatar({ contact, size }: { contact: ChatContact; size: number }) {
  return (
    <span className={`os-chat-avatar is-${contact.avatarKind}`} style={{ width: size, height: size }}>
      <img src={contact.avatar} alt="" width={size} height={size} draggable={false} />
      {contact.online ? <span className="os-chat-online" aria-hidden="true" /> : null}
    </span>
  )
}

function Action({ action, onOpenApp }: { action: ChatAction; onOpenApp: (id: DockAppId) => void }) {
  const inner = (
    <>
      <span>{action.label}</span>
      <img src="/os/arrow-out.svg" alt="" width={10} height={10} />
    </>
  )
  if ('app' in action) {
    return (
      <button type="button" className="os-chat-action" onClick={() => onOpenApp(action.app)}>
        {inner}
      </button>
    )
  }
  return (
    <a className="os-chat-action" href={action.href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  )
}

// Messages: the conversation with Gauthier, which starts by itself.
export default function Chat({ onOpenApp }: { onOpenApp: (id: DockAppId) => void }) {
  const reduce = useReducedMotion()
  const activeId = CHAT_CONTACTS[0].id
  const [threads, setThreads] = useState(emptyThreads)
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const contact = CHAT_CONTACTS.find((c) => c.id === activeId)!
  const thread = threads[activeId]

  const update = (id: string, fn: (t: Thread) => Thread) =>
    setThreads((all) => {
      const next = { ...all, [id]: fn(all[id]) }
      saved = next
      return next
    })

  // Opening a conversation for the first time queues its script.
  useEffect(() => {
    if (thread.started) return
    update(activeId, (t) => ({ ...t, started: true, pending: [...contact.script] }))
  }, [activeId, thread.started, contact.script])

  // Play the queue one message at a time, with a typing indicator before each.
  const first = thread.shown.length === 0
  const next = thread.pending[0]
  useEffect(() => {
    if (!next) return
    const id = activeId
    if (reduce) {
      update(id, (t) => ({ ...t, shown: [...t.shown, ...t.pending], pending: [] }))
      return
    }
    let typeTimer = 0
    const startTimer = window.setTimeout(
      () => {
        setTyping(true)
        typeTimer = window.setTimeout(() => {
          setTyping(false)
          update(id, (t) => ({ ...t, shown: [...t.shown, t.pending[0]], pending: t.pending.slice(1) }))
        }, typingTime(next))
      },
      first ? FIRST_DELAY : 250,
    )
    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(typeTimer)
      setTyping(false)
    }
  }, [next, activeId, reduce, first])

  // Keep the latest message in view.
  const mounted = useRef(false)
  useLayoutEffect(() => {
    const el = scrollRef.current
    // Reopened with history: jump straight to the end, then glide from there.
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce || !mounted.current ? 'auto' : 'smooth' })
    mounted.current = true
  }, [thread.shown.length, typing, activeId, reduce])

  const idle = !next && !typing && thread.started
  const choices = (contact.choices ?? []).filter((c) => !thread.picked.includes(c.id))
  const showChoices = idle && choices.length > 0 && (contact.choices?.length ?? 0) > 0

  function pick(id: string) {
    const choice = contact.choices!.find((c) => c.id === id)!
    const left = choices.length - 1
    update(activeId, (t) => ({
      ...t,
      picked: [...t.picked, id],
      shown: [...t.shown, { from: 'me', text: choice.label }],
      pending: [...choice.reply, ...(left > 0 ? [FOLLOW_UP] : [])],
    }))
  }

  function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    update(activeId, (t) => ({ ...t, shown: [...t.shown, { from: 'me', text }], pending: [...t.pending, ...answerFor(text)] }))
  }


  return (
    <div className="os-chat">
      <section className="os-chat-pane" aria-label={`Conversation with ${contact.name}`}>
        <header className="os-chat-head">
          <Avatar contact={contact} size={40} />
          <span className="os-chat-head-text">
            <span className="os-chat-head-name">{contact.name}</span>
            <span className="os-chat-head-status">{typing ? 'typing…' : contact.online ? 'Online' : 'Away'}</span>
          </span>
        </header>

        <div className="os-chat-scroll" ref={scrollRef} aria-live="polite">
          <p className="os-chat-day">Today</p>
          <AnimatePresence initial={false}>
            {thread.shown.map((m, i) => {
              const prev = thread.shown[i - 1]
              const grouped = prev?.from === m.from
              return (
                <motion.div
                  key={`${activeId}-${i}`}
                  className={`os-chat-row is-${m.from}${grouped ? ' is-grouped' : ''}`}
                  initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {m.from === 'them' ? (
                    <span className="os-chat-row-avatar">{grouped ? null : <Avatar contact={contact} size={28} />}</span>
                  ) : null}
                  <div className="os-chat-bubble">
                    <p>{m.text}</p>
                    {m.action ? <Action action={m.action} onOpenApp={onOpenApp} /> : null}
                  </div>
                </motion.div>
              )
            })}
            {typing ? (
              <motion.div
                key="typing"
                className="os-chat-row is-them is-typing"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <span className="os-chat-row-avatar">
                  {thread.shown[thread.shown.length - 1]?.from === 'them' ? null : <Avatar contact={contact} size={28} />}
                </span>
                <div className="os-chat-bubble" aria-label={`${contact.name} is typing`}>
                  <span className="os-chat-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {showChoices ? (
            <motion.div
              className="os-chat-choices"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {choices.map((c) => (
                <button key={c.id} type="button" className="os-chat-choice" onClick={() => pick(c.id)}>
                  {c.label}
                </button>
              ))}
            </motion.div>
          ) : null}
        </div>

        <form className="os-chat-composer" onSubmit={send}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${contact.name}`}
            aria-label={`Message ${contact.name}`}
          />
          <button type="submit" className="os-chat-send" aria-label="Send" disabled={!draft.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </form>
      </section>
    </div>
  )
}
