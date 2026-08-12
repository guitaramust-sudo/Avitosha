import type {
  Listing,
  ListingCategory,
  ListingFilters,
  ListingMessage,
  ListingPage,
  ListingWriteRequest,
  MarketplaceActionResponse,
  PhotoUploadForm,
} from '../types/marketplace'
import { ApiError, apiRequest } from './client'

const authorized = (accessToken: string): RequestInit => ({
  headers: { Authorization: `Bearer ${accessToken}` },
})

const withAuthorization = (
  accessToken: string,
  init: RequestInit = {},
): RequestInit => ({
  ...init,
  headers: {
    Authorization: `Bearer ${accessToken}`,
    ...init.headers,
  },
})

const listingPage = (response: ListingPage): ListingPage => ({
  ...response,
  items: response.items ?? [],
})

const createSearch = (filters: ListingFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.query) params.set('query', filters.query)
  params.set('limit', String(filters.limit ?? 20))
  params.set('offset', String(filters.offset ?? 0))
  return params.toString()
}

export const getListingCategories = async () => {
  const response = await apiRequest<{ categories: ListingCategory[] | null }>(
    '/api/v1/listing-categories',
  )
  return [...(response.categories ?? [])].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  )
}

export const getListings = async (filters: ListingFilters = {}) =>
  listingPage(
    await apiRequest<ListingPage>(`/api/v1/listings?${createSearch(filters)}`),
  )

export const getListing = (listingId: string) =>
  apiRequest<Listing>(`/api/v1/listings/${encodeURIComponent(listingId)}`)

export const getMyListings = async (accessToken: string) =>
  listingPage(
    await apiRequest<ListingPage>(
      '/api/v1/me/listings?limit=100&offset=0',
      authorized(accessToken),
    ),
  )

export const getFavoriteListings = async (accessToken: string) =>
  listingPage(
    await apiRequest<ListingPage>(
      '/api/v1/me/favorites?limit=100&offset=0',
      authorized(accessToken),
    ),
  )

export const createListing = (
  accessToken: string,
  request: ListingWriteRequest,
) =>
  apiRequest<Listing>(
    '/api/v1/listings',
    withAuthorization(accessToken, {
      body: JSON.stringify(request),
      method: 'POST',
    }),
  )

export const uploadListingPhoto = async (accessToken: string, file: File) => {
  const upload = await apiRequest<PhotoUploadForm>(
    '/api/v1/uploads/listing-photos',
    withAuthorization(accessToken, {
      body: JSON.stringify({
        contentType: file.type,
        fileName: file.name,
        size: file.size,
      }),
      method: 'POST',
    }),
  )
  const body = new FormData()
  Object.entries(upload.fields).forEach(([key, value]) =>
    body.append(key, value),
  )
  body.append('file', file)

  let response: Response
  try {
    response = await fetch(upload.url, { body, method: 'POST' })
  } catch {
    throw new ApiError(
      0,
      'network_error',
      'Не удалось загрузить фотографию. Проверьте подключение к интернету.',
    )
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      'unknown_error',
      'Хранилище не приняло фотографию. Попробуйте ещё раз.',
    )
  }

  return upload.publicUrl
}

export const updateListing = (
  accessToken: string,
  listingId: string,
  request: ListingWriteRequest & { eventId: string },
) =>
  apiRequest<MarketplaceActionResponse>(
    `/api/v1/listings/${encodeURIComponent(listingId)}`,
    withAuthorization(accessToken, {
      body: JSON.stringify(request),
      method: 'PATCH',
    }),
  )

export const publishListing = (
  accessToken: string,
  listingId: string,
  eventId: string,
) =>
  apiRequest<MarketplaceActionResponse>(
    `/api/v1/listings/${encodeURIComponent(listingId)}/publish`,
    withAuthorization(accessToken, {
      body: JSON.stringify({ eventId }),
      method: 'POST',
    }),
  )

export const unpublishListing = (accessToken: string, listingId: string) =>
  apiRequest<Listing>(
    `/api/v1/listings/${encodeURIComponent(listingId)}/unpublish`,
    withAuthorization(accessToken, { method: 'POST' }),
  )

export const addListingFavorite = (
  accessToken: string,
  listingId: string,
  eventId: string,
) =>
  apiRequest<MarketplaceActionResponse>(
    `/api/v1/listings/${encodeURIComponent(listingId)}/favorite`,
    withAuthorization(accessToken, {
      body: JSON.stringify({ eventId }),
      method: 'PUT',
    }),
  )

export const removeListingFavorite = (accessToken: string, listingId: string) =>
  apiRequest<{ created?: boolean; favorite: boolean; removed?: boolean }>(
    `/api/v1/listings/${encodeURIComponent(listingId)}/favorite`,
    withAuthorization(accessToken, { method: 'DELETE' }),
  )

export const registerListingView = (
  accessToken: string,
  listingId: string,
  eventId: string,
) =>
  apiRequest<MarketplaceActionResponse>(
    `/api/v1/listings/${encodeURIComponent(listingId)}/views`,
    withAuthorization(accessToken, {
      body: JSON.stringify({ eventId }),
      method: 'POST',
    }),
  )

export const getListingMessages = async (
  accessToken: string,
  listingId: string,
) => {
  const response = await apiRequest<{ messages: ListingMessage[] | null }>(
    `/api/v1/listings/${encodeURIComponent(listingId)}/messages`,
    authorized(accessToken),
  )
  return response.messages ?? []
}

export const contactListingSeller = (
  accessToken: string,
  listingId: string,
  body: string,
  eventId: string,
) =>
  apiRequest<MarketplaceActionResponse>(
    `/api/v1/listings/${encodeURIComponent(listingId)}/messages`,
    withAuthorization(accessToken, {
      body: JSON.stringify({ body, eventId }),
      method: 'POST',
    }),
  )

export const purchaseListing = (
  accessToken: string,
  listingId: string,
  deliveryUsed: boolean,
  eventId: string,
) =>
  apiRequest<MarketplaceActionResponse>(
    `/api/v1/listings/${encodeURIComponent(listingId)}/purchase`,
    withAuthorization(accessToken, {
      body: JSON.stringify({ deliveryUsed, eventId }),
      method: 'POST',
    }),
  )
