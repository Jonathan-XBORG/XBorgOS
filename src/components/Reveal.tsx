import { type ReactNode, useContext, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { ChatRootContext } from './chatRoot'

const ease = [0.2, 0.8, 0.2, 1] as const

// Messages reveal once, just before they scroll into the chat window, then stay.
export default function Reveal({
  children,
  delay = 0,
  className,
  immediate = false,
}: {
  children: ReactNode
  delay?: number
  className?: string
  immediate?: boolean
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const root = useContext(ChatRootContext)
  const inView = useInView(ref, {
    root: root ?? undefined,
    once: true,
    amount: 0,
    margin: '0px 0px 24px 0px',
  })

  if (immediate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, transform: 'translateY(8px)' }}
      animate={
        reduce || inView
          ? { opacity: 1, transform: 'translateY(0px)' }
          : { opacity: 0, transform: 'translateY(8px)' }
      }
      transition={{ duration: reduce ? 0 : 0.32, delay: reduce ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  )
}
