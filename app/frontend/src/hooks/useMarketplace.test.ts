import { describe, expect, it } from 'vitest'

import { getNextListingsOffset } from './useMarketplace'

describe('getNextListingsOffset', () => {
  it('returns the next backend offset while more listings exist', () => {
    expect(
      getNextListingsOffset({
        items: Array.from({ length: 20 }),
        offset: 20,
        total: 55,
      }),
    ).toBe(40)
  })

  it('stops when the final page has been loaded', () => {
    expect(
      getNextListingsOffset({
        items: Array.from({ length: 15 }),
        offset: 40,
        total: 55,
      }),
    ).toBeUndefined()
  })

  it('stops on an empty page to prevent an endless request loop', () => {
    expect(
      getNextListingsOffset({ items: [], offset: 20, total: 55 }),
    ).toBeUndefined()
  })
})
