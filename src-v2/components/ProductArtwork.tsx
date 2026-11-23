import type { ProductId } from '../screens'

export const PRODUCT_ARTWORK: Record<ProductId, string> = {
  propr: '/V2/icons/propr.svg',
  fanbase: '/V2/icons/fanbase.svg',
  trigr: '/V2/icons/trigr.svg',
}

export default function ProductArtwork({ id }: { id: ProductId }) {
  return <img src={PRODUCT_ARTWORK[id]} alt="" />
}
