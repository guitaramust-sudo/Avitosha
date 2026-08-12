import type {
  Listing,
  ListingQuality,
  ListingWriteRequest,
} from '../types/marketplace'

export const LISTING_DESCRIPTION_MIN_LENGTH = 150

export const hasPublishableListingDescription = (description: string) =>
  description.trim().length >= LISTING_DESCRIPTION_MIN_LENGTH

export const evaluateListingQuality = (
  listing: Pick<
    ListingWriteRequest,
    'description' | 'photoUrls' | 'priceKopecks'
  >,
): ListingQuality => {
  const missingFields: ListingQuality['missingFields'] = []

  if (listing.priceKopecks <= 0) missingFields.push('price')
  if (listing.photoUrls.length === 0) missingFields.push('photo')
  if (!hasPublishableListingDescription(listing.description)) {
    missingFields.push('description')
  }

  const hints: Record<ListingQuality['missingFields'][number], string> = {
    price: 'Укажите цену объявления',
    photo: 'Рекомендуем добавить хотя бы одну фотографию',
    description: 'Рекомендуем добавить подробное описание',
  }

  return {
    score: 3 - missingFields.length,
    isEligible: listing.priceKopecks > 0,
    missingFields,
    nextActionHint:
      missingFields.length > 0
        ? hints[missingFields[0]]
        : 'Объявление готово к публикации',
  }
}

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
