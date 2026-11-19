import type { ProductId } from '../screens'

export const PRODUCT_ARTWORK: Record<ProductId, string> = {
  propr: '/icons/propr.svg',
  fanbase: '/icons/fanbase.svg',
  trigr: '/icons/trigr.svg',
}

export default function ProductArtwork({ id }: { id: ProductId }) {
  return <img src={PRODUCT_ARTWORK[id]} alt="" />
}
