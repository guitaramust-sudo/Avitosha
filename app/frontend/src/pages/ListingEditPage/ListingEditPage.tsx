import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError } from '../../api/client'
import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import ListingForm from '../../components/ListingForm/ListingForm'
import ListingQuality from '../../components/ListingQuality/ListingQuality'
import {
  useMyListings,
  usePublishListing,
  useUnpublishListing,
  useUpdateListing,
} from '../../hooks/useMarketplace'
import type {
  ListingQuality as ListingQualityType,
  ListingWriteRequest,
} from '../../types/marketplace'

import '../marketplace-pages.scss'

function ListingEditPage() {
  const { listingId } = useParams()
  const listingsQuery = useMyListings()
  const updateListing = useUpdateListing(listingId)
  const publishListing = usePublishListing()
  const unpublishListing = useUnpublishListing()
  const [error, setError] = useState<string | null>(null)
  const [qualityPreview, setQualityPreview] =
    useState<ListingQualityType | null>(null)

  const runAction = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
      await listingsQuery.refetch()
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Не удалось сохранить изменения.',
      )
    }
  }

  if (listingsQuery.isPending)
    return <div className="marketplace-state">Загружаем редактор…</div>
  const listing = listingsQuery.data?.items.find(
    (item) => item.id === listingId,
  )

  if (listingsQuery.isError || !listing) {
    return (
      <div className="marketplace-state marketplace-state--error">
        Объявление недоступно.
      </div>
    )
  }

  const update = (request: ListingWriteRequest) =>
    runAction(() =>
      updateListing.mutateAsync({ ...request, eventId: crypto.randomUUID() }),
    )

  const displayedQuality = qualityPreview ?? listing.quality
  const canPublish = displayedQuality.isEligible

  return (
    <section className="marketplace-page marketplace-page--form">
      <GamePageHeader
        eyebrow="Редактор"
        title={listing.title}
        description="Добавьте подробное описание, цену и фотографии, чтобы объявление заметили быстрее."
        action={
          <Link
            className="marketplace-button marketplace-button--muted"
            to="/marketplace/my"
          >
            К списку
          </Link>
        }
      />

      <div className="listing-editor-layout">
        <div>
          {error && <p className="marketplace-error">{error}</p>}
          <ListingForm
            initialListing={listing}
            isPending={updateListing.isPending}
            onQualityChange={setQualityPreview}
            onSubmit={(request) => void update(request)}
            submitLabel="Сохранить изменения"
          />
        </div>
        <aside>
          <ListingQuality quality={displayedQuality} />
          {listing.status === 'PUBLISHED' ? (
            <button
              className="marketplace-button marketplace-button--muted"
              type="button"
              disabled={unpublishListing.isPending}
              onClick={() =>
                void runAction(() => unpublishListing.mutateAsync(listing.id))
              }
            >
              Снять с публикации
            </button>
          ) : (
            <button
              className="marketplace-button"
              type="button"
              disabled={!canPublish || publishListing.isPending}
              onClick={() =>
                void runAction(() =>
                  publishListing.mutateAsync({
                    eventId: crypto.randomUUID(),
                    listingId: listing.id,
                  }),
                )
              }
            >
              {publishListing.isPending ? 'Публикуем…' : 'Опубликовать'}
            </button>
          )}
          {!canPublish && (
            <small>Перед публикацией укажите цену больше нуля.</small>
          )}
        </aside>
      </div>
    </section>
  )
}

export default ListingEditPage
