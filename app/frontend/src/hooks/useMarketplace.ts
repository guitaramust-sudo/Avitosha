import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useCallback } from 'react'

import {
  addListingFavorite,
  contactListingSeller,
  createListing,
  getFavoriteListings,
  getListing,
  getListingCategories,
  getListingMessages,
  getListings,
  getMyListings,
  publishListing,
  purchaseListing,
  registerListingView,
  removeListingFavorite,
  unpublishListing,
  updateListing,
  uploadListingPhoto,
} from '../api/marketplace'
import { acceptGameEvents } from '../store/gameSlice'
import { showToast } from '../store/toastSlice'
import type {
  ListingFilters,
  ListingWriteRequest,
  MarketplaceActionResponse,
} from '../types/marketplace'
import { getGameEventMessage } from '../utils/gamePresentation'
import { useAppDispatch, useAuthCredentials } from './redux'
import { invalidateGameQueriesForEvents } from './useGameDashboard'

export const marketplaceQueryKeys = {
  all: ['marketplace'] as const,
  categories: ['marketplace', 'categories'] as const,
  catalog: (filters: ListingFilters) =>
    ['marketplace', 'catalog', filters] as const,
  favorites: (userId: string) => ['marketplace', userId, 'favorites'] as const,
  listing: (listingId: string) =>
    ['marketplace', 'listing', listingId] as const,
  messages: (userId: string, listingId: string) =>
    ['marketplace', userId, 'messages', listingId] as const,
  mine: (userId: string) => ['marketplace', userId, 'mine'] as const,
}

export const useListingCategories = () =>
  useQuery({
    queryKey: marketplaceQueryKeys.categories,
    queryFn: getListingCategories,
    staleTime: 10 * 60 * 1000,
  })

export const useListings = (filters: ListingFilters) =>
  useQuery({
    queryKey: marketplaceQueryKeys.catalog(filters),
    queryFn: () => getListings(filters),
  })

export const getNextListingsOffset = (lastPage: {
  items: unknown[]
  offset: number
  total: number
}) => {
  const nextOffset = lastPage.offset + lastPage.items.length
  return lastPage.items.length > 0 && nextOffset < lastPage.total
    ? nextOffset
    : undefined
}

export const useInfiniteListings = (filters: Omit<ListingFilters, 'offset'>) =>
  useInfiniteQuery({
    queryKey: marketplaceQueryKeys.catalog(filters),
    queryFn: ({ pageParam }) => getListings({ ...filters, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: getNextListingsOffset,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

export const useListing = (listingId: string | undefined) =>
  useQuery({
    queryKey: marketplaceQueryKeys.listing(listingId ?? ''),
    queryFn: () => getListing(listingId ?? ''),
    enabled: Boolean(listingId),
  })

export const useMyListings = () => {
  const { accessToken, userId } = useAuthCredentials()
  return useQuery({
    queryKey: marketplaceQueryKeys.mine(userId ?? ''),
    queryFn: () => getMyListings(accessToken ?? ''),
    enabled: Boolean(accessToken && userId),
  })
}

export const useFavoriteListings = () => {
  const { accessToken, userId } = useAuthCredentials()
  return useQuery({
    queryKey: marketplaceQueryKeys.favorites(userId ?? ''),
    queryFn: () => getFavoriteListings(accessToken ?? ''),
    enabled: Boolean(accessToken && userId),
  })
}

export const useListingMessages = (
  listingId: string | undefined,
  enabled = true,
) => {
  const { accessToken, userId } = useAuthCredentials()
  return useQuery({
    queryKey: marketplaceQueryKeys.messages(userId ?? '', listingId ?? ''),
    queryFn: () => getListingMessages(accessToken ?? '', listingId ?? ''),
    enabled: Boolean(accessToken && userId && listingId && enabled),
  })
}

const useMarketplaceFeedback = () => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { userId } = useAuthCredentials()

  return useCallback(
    async (response: MarketplaceActionResponse) => {
      const result = response.actionResult
      if (!result) return

      const acceptedEvents = dispatch(acceptGameEvents(result.events))
      if (result.duplicate || acceptedEvents.length === 0) return

      await invalidateGameQueriesForEvents(queryClient, userId, acceptedEvents)
      dispatch(showToast({ message: getGameEventMessage(acceptedEvents) }))
    },
    [dispatch, queryClient, userId],
  )
}

const useRefreshMarketplace = () => {
  const queryClient = useQueryClient()
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all }),
    [queryClient],
  )
}

export const useCreateListing = () => {
  const { accessToken } = useAuthCredentials()
  const refreshMarketplace = useRefreshMarketplace()
  return useMutation({
    mutationFn: (request: ListingWriteRequest) =>
      createListing(accessToken ?? '', request),
    onSuccess: refreshMarketplace,
  })
}

export const useUploadListingPhotos = () => {
  const { accessToken } = useAuthCredentials()
  return useMutation({
    mutationFn: (files: File[]) =>
      Promise.all(
        files.map((file) => uploadListingPhoto(accessToken ?? '', file)),
      ),
  })
}

export const useUpdateListing = (listingId: string | undefined) => {
  const { accessToken } = useAuthCredentials()
  const feedback = useMarketplaceFeedback()
  const refreshMarketplace = useRefreshMarketplace()
  return useMutation({
    mutationFn: (request: ListingWriteRequest & { eventId: string }) =>
      updateListing(accessToken ?? '', listingId ?? '', request),
    onSuccess: async (response) => {
      await refreshMarketplace()
      await feedback(response)
    },
  })
}

export const usePublishListing = () => {
  const { accessToken } = useAuthCredentials()
  const feedback = useMarketplaceFeedback()
  const refreshMarketplace = useRefreshMarketplace()
  return useMutation({
    mutationFn: ({
      eventId,
      listingId,
    }: {
      eventId: string
      listingId: string
    }) => publishListing(accessToken ?? '', listingId, eventId),
    onSuccess: async (response) => {
      await refreshMarketplace()
      await feedback(response)
    },
  })
}

export const useUnpublishListing = () => {
  const { accessToken } = useAuthCredentials()
  const refreshMarketplace = useRefreshMarketplace()
  return useMutation({
    mutationFn: (listingId: string) =>
      unpublishListing(accessToken ?? '', listingId),
    onSuccess: refreshMarketplace,
  })
}

export const useAddFavorite = () => {
  const { accessToken } = useAuthCredentials()
  const feedback = useMarketplaceFeedback()
  const refreshMarketplace = useRefreshMarketplace()
  return useMutation({
    mutationFn: ({
      eventId,
      listingId,
    }: {
      eventId: string
      listingId: string
    }) => addListingFavorite(accessToken ?? '', listingId, eventId),
    onSuccess: async (response) => {
      await refreshMarketplace()
      await feedback(response)
    },
  })
}

export const useRemoveFavorite = () => {
  const { accessToken } = useAuthCredentials()
  const refreshMarketplace = useRefreshMarketplace()
  return useMutation({
    mutationFn: (listingId: string) =>
      removeListingFavorite(accessToken ?? '', listingId),
    onSuccess: refreshMarketplace,
  })
}

export const useRegisterListingView = () => {
  const { accessToken } = useAuthCredentials()
  const feedback = useMarketplaceFeedback()
  return useMutation({
    mutationFn: ({
      eventId,
      listingId,
    }: {
      eventId: string
      listingId: string
    }) => registerListingView(accessToken ?? '', listingId, eventId),
    onSuccess: feedback,
  })
}

export const useContactSeller = (listingId: string | undefined) => {
  const { accessToken, userId } = useAuthCredentials()
  const feedback = useMarketplaceFeedback()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body, eventId }: { body: string; eventId: string }) =>
      contactListingSeller(accessToken ?? '', listingId ?? '', body, eventId),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: marketplaceQueryKeys.messages(userId ?? '', listingId ?? ''),
      })
      await feedback(response)
    },
  })
}

export const usePurchaseListing = () => {
  const { accessToken } = useAuthCredentials()
  const feedback = useMarketplaceFeedback()
  const refreshMarketplace = useRefreshMarketplace()
  return useMutation({
    mutationFn: ({
      deliveryUsed,
      eventId,
      listingId,
    }: {
      deliveryUsed: boolean
      eventId: string
      listingId: string
    }) => purchaseListing(accessToken ?? '', listingId, deliveryUsed, eventId),
    onSuccess: async (response) => {
      await refreshMarketplace()
      await feedback(response)
    },
  })
}
