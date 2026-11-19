import { PRODUCTS } from '../products'
import type { ProductId } from '../screens'
import ProductArtwork from './ProductArtwork'
import Reveal from './Reveal'

export default function ProductPanel({
  onOpen,
}: {
  onOpen: (id: ProductId) => void
}) {
  return (
    <div className="product-panel" data-panel="products">
      {PRODUCTS.map((product, i) => {
        return (
          <Reveal key={product.id} delay={0.08 * i} className="product-tile-wrap">
            <button
              type="button"
              className="product-tile"
              data-product={product.id}
              onClick={() => onOpen(product.id)}
            >
              <span className="product-tile-icon">
                <ProductArtwork id={product.id} />
              </span>
              <span className="product-tile-name">{product.name}</span>
              <span className="product-tile-lead">{product.lead}</span>
              <span className="product-tile-status">
                <span className={`status-dot${product.status === 'Live' ? ' is-live' : ' is-wait'}`} />
                {product.status}
              </span>
            </button>
          </Reveal>
        )
      })}
    </div>
  )
}
