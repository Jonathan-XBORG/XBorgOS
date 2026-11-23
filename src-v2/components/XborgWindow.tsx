import { type ReactNode, type Ref } from 'react'
import WindowControls from './WindowControls'

export default function XborgWindow({
  dimmed,
  bodyRef,
  onScroll,
  children,
}: {
  dimmed: boolean
  bodyRef: Ref<HTMLDivElement>
  onScroll: () => void
  children: ReactNode
}) {
  return (
    <section
      className="window window-xborg"
      role="region"
      aria-label="XBorg"
      data-dimmed={dimmed ? 'true' : 'false'}
    >
      <div className="window-frame">
        <div className="window-title">
          <WindowControls />
          <span className="window-name">XBORG</span>
        </div>
        <div
          className="window-body"
          tabIndex={0}
          ref={bodyRef}
          onScroll={onScroll}
          style={dimmed ? { overflow: 'hidden' } : undefined}
        >
          {children}
        </div>
      </div>
    </section>
  )
}
