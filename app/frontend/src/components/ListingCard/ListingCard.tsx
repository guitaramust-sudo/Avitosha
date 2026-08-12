import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type { Listing } from '../../types/marketplace'
import {
  formatListingPrice,
  listingStatusLabels,
} from '../../utils/marketplacePresentation'

import './ListingCard.scss'

interface ListingCardProps {
  action?: ReactNode
  listing: Listing
  showStatus?: boolean
}

function ListingCard({
  action,
  listing,
  showStatus = false,
}: ListingCardProps) {
  const photo = listing.photoUrls[0]
  const listingUrl = showStatus
    ? `/marketplace/listings/${listing.id}/edit`
    : `/marketplace/listings/${listing.id}`

  return (
    <article className="listing-card">
      <Link className="listing-card__image" to={listingUrl}>
        {photo ? (
          <img src={photo} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">Фото появится здесь</span>
        )}
      </Link>
      <div className="listing-card__body">
        <Link to={listingUrl}>{listing.title}</Link>
        <strong>{formatListingPrice(listing.priceKopecks)}</strong>
        <div className="listing-card__meta">
          {showStatus && (
            <span
              className={`listing-status listing-status--${listing.status.toLowerCase()}`}
            >
              {listingStatusLabels[listing.status]}
            </span>
          )}
          <small>
            {listing.isDemo ? 'Демо-объявление' : 'Пользователь Авито'}
          </small>
        </div>
        {action && <div className="listing-card__action">{action}</div>}
      </div>
    </article>
  )
}

export default ListingCard
