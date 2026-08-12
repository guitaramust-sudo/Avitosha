import type { ActionResult } from './game'

export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'SOLD' | 'UNPUBLISHED'

export interface ListingCategory {
  code: string
  name: string
  sortOrder: number
}

export interface ListingQuality {
  score: number
  isEligible: boolean
  missingFields: Array<'description' | 'photo' | 'price'>
  nextActionHint: string
}

export interface Listing {
  id: string
  ownerId: string
  categoryCode: string
  title: string
  description: string
  priceKopecks: number
  status: ListingStatus
  isDemo: boolean
  publishedAt: string | null
  soldAt: string | null
  photoUrls: string[]
  quality: ListingQuality
}

export interface ListingPage {
  items: Listing[]
  total: number
  limit: number
  offset: number
}

export interface ListingWriteRequest {
  categoryCode: string
  title: string
  description: string
  priceKopecks: number
  photoUrls: string[]
}

export interface PhotoUploadRequest {
  fileName: string
  contentType: string
  size: number
}

export interface PhotoUploadForm {
  url: string
  fields: Record<string, string>
  publicUrl: string
  objectKey: string
  expiresAt: string
  maxFileSize: number
}

export interface ListingMessage {
  id: string
  listingId: string
  senderId: string
  recipientId: string
  body: string
  createdAt: string
}

export interface ListingDeal {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  deliveryUsed: boolean
  completedAt: string
}

export interface MarketplaceActionResponse {
  listing?: Listing
  deal?: ListingDeal
  message?: ListingMessage
  favorite?: boolean
  counted?: boolean
  first?: boolean
  actionResult?: ActionResult
}

export interface ListingFilters {
  category?: string
  query?: string
  limit?: number
  offset?: number
}
