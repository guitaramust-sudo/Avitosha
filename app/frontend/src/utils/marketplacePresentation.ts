import type { Listing } from '../types/marketplace'

export const formatListingPrice = (priceKopecks: number) =>
  new Intl.NumberFormat('ru-RU', {
    currency: 'RUB',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(priceKopecks / 100)

export const listingStatusLabels: Record<Listing['status'], string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликовано',
  SOLD: 'Продано',
  UNPUBLISHED: 'Снято с публикации',
}
