import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  addListingFavorite,
  createListing,
  getListings,
  publishListing,
  registerListingView,
  updateListing,
  uploadListingPhoto,
} from './marketplace'

const jsonResponse = (body: unknown, status = 200) =>
  ({
    headers: { get: () => 'application/json' },
    json: vi.fn().mockResolvedValue(body),
    ok: status >= 200 && status < 300,
    status,
  }) as unknown as Response

const storageErrorResponse = (code: string, status: number) =>
  ({
    ok: false,
    status,
    text: vi.fn().mockResolvedValue(`<Error><Code>${code}</Code></Error>`),
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
    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty(
      'X-User-ID',
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

  it('uploads a photo directly using every signed form field', async () => {
    const uploadForm = {
      expiresAt: '2026-08-12T10:40:00Z',
      fields: {
        key: 'listing-photos/user/photo.jpg',
        policy: 'signed-policy',
        'x-amz-signature': 'signature',
      },
      maxFileSize: 10_485_760,
      objectKey: 'listing-photos/user/photo.jpg',
      publicUrl: '/storage/avitosha-photos/listing-photos/user/photo.jpg',
      url: '/storage/avitosha-photos',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(uploadForm, 201))
      .mockResolvedValueOnce(jsonResponse(null, 204))
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(uploadListingPhoto('access-token', file)).resolves.toBe(
      uploadForm.publicUrl,
    )

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/uploads/listing-photos')
    const storageRequest = fetchMock.mock.calls[1]
    expect(storageRequest?.[0]).toBe(uploadForm.url)
    const body = (storageRequest?.[1] as RequestInit).body as FormData
    expect(Array.from(body.keys())).toEqual([
      'key',
      'policy',
      'x-amz-signature',
      'file',
    ])
    expect(body.get('file')).toBe(file)
  })

  it('shows the MinIO error code when a signed upload is rejected', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          expiresAt: '2026-08-12T10:40:00Z',
          fields: { key: 'photo.jpg' },
          maxFileSize: 10_485_760,
          objectKey: 'photo.jpg',
          publicUrl: '/storage/avitosha-photos/photo.jpg',
          url: '/storage/avitosha-photos',
        }),
      )
      .mockResolvedValueOnce(storageErrorResponse('SignatureDoesNotMatch', 403))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      uploadListingPhoto(
        'access-token',
        new File(['image'], 'photo.jpg', { type: 'image/jpeg' }),
      ),
    ).rejects.toThrow('SignatureDoesNotMatch')
  })
})
