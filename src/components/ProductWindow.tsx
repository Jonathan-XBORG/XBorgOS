import { PRODUCTS } from '../products'
import type { ScreenId } from '../screens'
import AppWindow, { centred, type WindowOrigin } from './AppWindow'
import { IconArrow } from './Icons'
import ProductArtwork from './ProductArtwork'

export type { WindowOrigin }

const MIN_SIZE = { w: 520, h: 400 }
const INITIAL = centred(640, 576)

export default function ProductWindow({
  screen,
  origin,
  onClose,
}: {
  screen: ScreenId
  origin: WindowOrigin | null
  onClose: () => void
}) {
  const product =
    screen === 'propr' || screen === 'fanbase' || screen === 'trigr'
      ? PRODUCTS.find((p) => p.id === screen)
      : null

  return (
    <AppWindow
      id={`product-${product?.id ?? 'none'}`}
      open={Boolean(product)}
      title={product?.name ?? 'PRODUCT'}
      className="window-product"
      min={MIN_SIZE}
      initial={INITIAL}
      origin={origin}
      onClose={onClose}
    >
      <div className="window-body product-body">
        {product && (
          <>
            <div className="product-head">
              <span className="product-mark">
                <ProductArtwork id={product.id} />
              </span>
              <h2 className="product-name">{product.name}</h2>
            </div>
            <p className="product-status">
              <span className={`status-dot${product.status === 'Live' ? ' is-live' : ' is-wait'}`} />
              {product.status}
            </p>
            <p className="product-lead">{product.lead}</p>
            <div className="product-media">
              <img src={product.capture} alt="" />
              <span className="capture-label">{product.captureLabel}</span>
            </div>
            {product.proof && <p className="product-proof">{product.proof}</p>}
            <span className="btn-wrap">
              <a className="btn btn-primary" href={product.href} target="_blank" rel="noreferrer">
                {product.action}
                <IconArrow />
              </a>
            </span>
          </>
        )}
      </div>
    </AppWindow>
  )
}
