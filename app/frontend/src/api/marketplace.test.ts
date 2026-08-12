import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  addListingFavorite,
  createListing,
  getListings,
  publishListing,
  registerListingView,
  updateListing,
} from './marketplace'

const jsonResponse = (body: unknown, status = 200) =>
  ({
    headers: { get: () => 'application/json' },
    json: vi.fn().mockResolvedValue(body),
    ok: status >= 200 && status < 300,
    status,
  }) as unknown as Response

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('marketplace API', () => {
  it('loads the public catalog with documented filters', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: null, limit: 12, offset: 0, total: 0 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getListings({ category: 'FURNITURE', limit: 12, query: 'стол' }),
    ).resolves.toMatchObject({ items: [], total: 0 })

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/api/v1/listings?category=FURNITURE&query=%D1%81%D1%82%D0%BE%D0%BB&limit=12&offset=0',
    )
  })

  it('creates a draft without adding client-side game fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 'listing-id' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    const request = {
      categoryCode: 'FURNITURE',
      description: 'Описание',
      photoUrls: [],
      priceKopecks: 0,
      title: 'Стол',
    }

    await createListing('access-token', request)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/listings',
      expect.objectContaining({
        body: JSON.stringify(request),
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      }),
    )
  })

  it.each([
    ['view', registerListingView, '/api/v1/listings/listing-id/views', 'POST'],
    [
      'favorite',
      addListingFavorite,
      '/api/v1/listings/listing-id/favorite',
      'PUT',
    ],
    ['publish', publishListing, '/api/v1/listings/listing-id/publish', 'POST'],
  ] as const)(
    'sends the same event id for %s mutation',
    async (_, mutation, path, method) => {
      const fetchMock = vi.fn().mockResolvedValue(
        jsonResponse({
          actionResult: { actionId: 'action', duplicate: false, events: [] },
        }),
      )
      vi.stubGlobal('fetch', fetchMock)

      await mutation('access-token', 'listing-id', 'event-id')

      expect(fetchMock).toHaveBeenCalledWith(
        path,
        expect.objectContaining({
          body: JSON.stringify({ eventId: 'event-id' }),
          method,
        }),
      )
    },
  )

  it('includes eventId when improving a listing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ listing: {} }))
    vi.stubGlobal('fetch', fetchMock)
    const request = {
      categoryCode: 'FURNITURE',
      description: 'Подробное описание',
      eventId: 'event-id',
      photoUrls: ['https://example.com/photo.jpg'],
      priceKopecks: 100_000,
      title: 'Стол',
    }

    await updateListing('access-token', 'listing-id', request)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/listings/listing-id',
      expect.objectContaining({
        body: JSON.stringify(request),
        method: 'PATCH',
      }),
    )
  })
})
