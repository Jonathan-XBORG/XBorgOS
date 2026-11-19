import { Fragment } from 'react'
import type { OsProduct } from './data'
import { README_LINES } from './data'

export function DiscoverButton({ product }: { product: OsProduct }) {
  return (
    <a className="os-cta" href={product.href} target="_blank" rel="noreferrer">
      <span>{product.action}</span>
      <img src="/os/arrow-out.svg" alt="" width={12} height={12} />
    </a>
  )
}

// A product window: capture on the left, pitch and link on the right.
export function ProductContent({ product }: { product: OsProduct }) {
  return (
    <div className="os-product">
      <img className="os-shot" src={product.shot} alt={`${product.name} interface`} />
      <div className="os-product-copy">
        <div className="os-product-text">
          <p className="os-lead">{product.lead}</p>
          {product.proof ? <p className="os-proof">{product.proof}</p> : null}
        </div>
        <DiscoverButton product={product} />
      </div>
    </div>
  )
}

const PRODUCT_LINKS: Record<string, string> = {
  fanbase: 'https://fanbase.gg/',
  propr: 'https://propr.xyz',
}
const NAMES = /\b(FanBase|Fanbase|Propr)\b/g

// Every mention of a product links to its site. The one line that sets the
// names in bold in the design keeps them bold.
function withLinks(line: string) {
  const bold = line.startsWith('FanBase grew')
  return line.split(NAMES).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
    const link = (
      <a key={i} className="os-readme-link" href={PRODUCT_LINKS[part.toLowerCase()]} target="_blank" rel="noreferrer">
        {part}
      </a>
    )
    return bold ? <strong key={i}>{link}</strong> : link
  })
}

// Readme.txt: the site's story, one line per paragraph.
export function ReadmeContent() {
  return (
    <div className="os-readme">
      {README_LINES.map((line) => (
        <p key={line}>{withLinks(line)}</p>
      ))}
    </div>
  )
}

export function FolderContent() {
  return (
    <div className="os-folder-empty">
      <p>This folder is empty for now.</p>
    </div>
  )
}
