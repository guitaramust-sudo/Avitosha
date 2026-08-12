import { describe, expect, it } from 'vitest'

import { evaluateListingQuality } from './marketplacePresentation'

describe('evaluateListingQuality', () => {
  it('updates quality from the current unsaved listing fields', () => {
    expect(
      evaluateListingQuality({
        description: 'Подробное описание объявления. '.repeat(6),
        photoUrls: ['/storage/photo.jpg'],
        priceKopecks: 10_000,
      }),
    ).toEqual({
      score: 3,
      isEligible: true,
      missingFields: [],
      nextActionHint: 'Объявление готово к публикации',
    })
  })

  it('reports every missing quality criterion', () => {
    expect(
      evaluateListingQuality({
        description: '',
        photoUrls: [],
        priceKopecks: 0,
      }),
    ).toMatchObject({
      score: 0,
      isEligible: false,
      missingFields: ['price', 'photo', 'description'],
    })
  })
})
