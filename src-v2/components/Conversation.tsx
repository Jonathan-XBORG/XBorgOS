import { Fragment } from 'react'
import { BEATS } from '../conversation'
import type { ProductId } from '../screens'
import PortalPanel from './PortalPanel'
import ProductPanel from './ProductPanel'
import Reveal from './Reveal'

// Product names inside a message open that product's window. The script text is unchanged.
const PRODUCT_LINKS: Record<string, ProductId> = { Propr: 'propr', FanBase: 'fanbase', Trigr: 'trigr' }
const PRODUCT_PATTERN = /\b(Propr|FanBase|Trigr)\b/

function MessageText({ text, onOpenProduct }: { text: string; onOpenProduct: (id: ProductId) => void }) {
  return text.split(PRODUCT_PATTERN).map((part, i) => {
    const id = PRODUCT_LINKS[part]
    if (!id) return <Fragment key={i}>{part}</Fragment>
    return (
      <button key={i} type="button" className="inline-link" data-product-link={id} onClick={() => onOpenProduct(id)}>
        {part}
      </button>
    )
  })
}

export default function Conversation({
  onOpenProduct,
  onOpenStake,
}: {
  onOpenProduct: (id: ProductId) => void
  onOpenStake: () => void
}) {
  return (
    <article className="conversation">
      {BEATS.map((beat, beatIndex) => (
        <section key={beat.id} className="beat">
          <Reveal immediate={beatIndex === 0}>
            {/* A quiet separator, as a messaging app marks a new day. */}
            <p className="beat-label">
              <span className="beat-name">{beat.label}</span>
            </p>
          </Reveal>
          {beat.messages.map((message, i) => (
            <Reveal key={message} immediate={beatIndex === 0} delay={0.06 * i} className="bubble">
              <MessageText text={message} onOpenProduct={onOpenProduct} />
            </Reveal>
          ))}
          {beat.kind === 'products' && <ProductPanel onOpen={onOpenProduct} />}
          {beat.kind === 'portal' && <PortalPanel onEnter={onOpenStake} />}
        </section>
      ))}
    </article>
  )
}
