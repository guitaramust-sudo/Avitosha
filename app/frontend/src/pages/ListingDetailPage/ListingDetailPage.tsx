import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '../../api/client'
import ListingGallery from '../../components/ListingGallery/ListingGallery'
import ListingQuality from '../../components/ListingQuality/ListingQuality'
import { useAppSelector } from '../../hooks/redux'
import {
  useAddFavorite,
  useContactSeller,
  useFavoriteListings,
  useListing,
  useListingMessages,
  usePurchaseListing,
  useRegisterListingView,
  useRemoveFavorite,
} from '../../hooks/useMarketplace'
import {
  formatListingPrice,
  listingStatusLabels,
} from '../../utils/marketplacePresentation'

import '../marketplace-pages.scss'

function ListingDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const listingQuery = useListing(listingId)
  const listing = listingQuery.data
  const isOwner = Boolean(user?.id && listing?.ownerId === user.id)
  const favorites = useFavoriteListings()
  const isFavorite = Boolean(
    favorites.data?.items.some((item) => item.id === listingId),
  )
  const messages = useListingMessages(listingId, Boolean(listing && !isOwner))
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const registerView = useRegisterListingView()
  const contactSeller = useContactSeller(listingId)
  const purchase = usePurchaseListing()
  const viewRegistered = useRef(false)
  const [message, setMessage] = useState(
    'Здравствуйте! Объявление ещё актуально?',
  )
  const [deliveryUsed, setDeliveryUsed] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [purchasedListingId, setPurchasedListingId] = useState<string | null>(
    null,
  )
  const purchaseStorageKey =
    user?.id && listingId ? `avitosha:purchase:${user.id}:${listingId}` : null
  const purchaseCompleted = Boolean(
    purchasedListingId === listingId ||
    (purchaseStorageKey && localStorage.getItem(purchaseStorageKey) === 'true'),
  )

  const rememberPurchase = () => {
    if (!listingId) return
    setPurchasedListingId(listingId)
    if (purchaseStorageKey) localStorage.setItem(purchaseStorageKey, 'true')
  }

  useEffect(() => {
    if (!listing || !isAuthenticated || isOwner || viewRegistered.current)
      return
    viewRegistered.current = true
    registerView.mutate({ eventId: crypto.randomUUID(), listingId: listing.id })
  }, [isAuthenticated, isOwner, listing, registerView])

  const requireAuthentication = () => {
    if (isAuthenticated) return true
    void navigate('/login')
    return false
  }

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await action()
      return true
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === 'demo_purchase_already_completed'
      ) {
        rememberPurchase()
        setActionError(null)
        return false
      }
      setActionError(
        error instanceof ApiError
          ? error.message
          : 'Не удалось выполнить действие. Попробуйте ещё раз.',
      )
      return false
    }
  }

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!requireAuthentication() || !message.trim()) return
    void runAction(() =>
      contactSeller.mutateAsync({
        body: message.trim(),
        eventId: crypto.randomUUID(),
      }),
    )
  }

  if (listingQuery.isPending) {
    return <div className="marketplace-state">Открываем объявление…</div>
  }

  if (!listing) {
    return (
      <div className="marketplace-state marketplace-state--error">
        Объявление не найдено или больше недоступно.
        <Link to="/marketplace">Вернуться в каталог</Link>
      </div>
    )
  }

  return (
    <section className="listing-detail">
      <div className="listing-detail__breadcrumbs">
        <Link to="/marketplace">Объявления</Link>
        <span>›</span>
        <span>{listing.title}</span>
      </div>

      <div className="listing-detail__layout">
        <div className="listing-detail__main">
          <ListingGallery
            photoUrls={listing.photoUrls}
            showThumbnails
            title={listing.title}
            variant="detail"
          />
          <div className="listing-detail__copy">
            <span
              className={`listing-status listing-status--${listing.status.toLowerCase()}`}
            >
              {listingStatusLabels[listing.status]}
            </span>
            <h1>{listing.title}</h1>
            <strong>{formatListingPrice(listing.priceKopecks)}</strong>
            <p>{listing.description || 'Продавец пока не добавил описание.'}</p>
          </div>
        </div>

        <aside className="listing-detail__aside">
          {isOwner ? (
            <>
              <strong>Это ваше объявление</strong>
              <Link
                className="marketplace-button"
                to={`/marketplace/listings/${listing.id}/edit`}
              >
                Редактировать
              </Link>
              <ListingQuality quality={listing.quality} />
            </>
          ) : (
            <>
              <button
                className="marketplace-button"
                type="button"
                disabled={addFavorite.isPending || removeFavorite.isPending}
                onClick={() => {
                  if (!requireAuthentication()) return
                  void runAction(() =>
                    isFavorite
                      ? removeFavorite.mutateAsync(listing.id)
                      : addFavorite.mutateAsync({
                          eventId: crypto.randomUUID(),
                          listingId: listing.id,
                        }),
                  )
                }}
              >
                {isFavorite ? 'Убрать из избранного' : '♡ Добавить в избранное'}
              </button>

              <form className="listing-contact" onSubmit={sendMessage}>
                <label htmlFor="seller-message">Написать продавцу</label>
                <textarea
                  id="seller-message"
                  maxLength={2000}
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <button type="submit" disabled={contactSeller.isPending}>
                  {contactSeller.isPending
                    ? 'Отправляем…'
                    : 'Отправить сообщение'}
                </button>
              </form>

              {listing.status === 'PUBLISHED' && !purchaseCompleted && (
                <section className="listing-purchase">
                  <strong>Оформить покупку</strong>
                  <label>
                    <input
                      type="checkbox"
                      checked={deliveryUsed}
                      onChange={(event) =>
                        setDeliveryUsed(event.target.checked)
                      }
                    />
                    Использовать Авито Доставку
                  </label>
                  <button
                    type="button"
                    disabled={purchase.isPending}
                    onClick={() => {
                      if (!requireAuthentication()) return
                      void runAction(() =>
                        purchase.mutateAsync({
                          deliveryUsed,
                          eventId: crypto.randomUUID(),
                          listingId: listing.id,
                        }),
                      ).then((succeeded) => {
                        if (succeeded) rememberPurchase()
                      })
                    }}
                  >
                    {purchase.isPending ? 'Оформляем…' : 'Купить'}
                  </button>
                </section>
              )}
              {purchaseCompleted && (
                <p className="listing-purchase__success">
                  Вы уже купили этот товар
                </p>
              )}
            </>
          )}

          {actionError && <p className="marketplace-error">{actionError}</p>}
        </aside>
      </div>

      {isAuthenticated &&
        !isOwner &&
        messages.data &&
        messages.data.length > 0 && (
          <section className="listing-messages">
            <h2>Переписка</h2>
            {messages.data.map((item) => (
              <article key={item.id}>
                <p>{item.body}</p>
                <time dateTime={item.createdAt}>
                  {new Intl.DateTimeFormat('ru-RU', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(item.createdAt))}
                </time>
              </article>
            ))}
          </section>
        )}

      <div className="listing-detail__footer-actions">
        <Link to="/marketplace">К объявлениям</Link>
      </div>
    </section>
  )
}

export default ListingDetailPage
