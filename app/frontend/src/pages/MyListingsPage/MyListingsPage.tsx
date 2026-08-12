import { Link } from 'react-router-dom'

import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import ListingCard from '../../components/ListingCard/ListingCard'
import { useMyListings } from '../../hooks/useMarketplace'

import '../marketplace-pages.scss'

function MyListingsPage() {
  const listings = useMyListings()

  return (
    <section className="marketplace-page">
      <GamePageHeader
        eyebrow="Личный кабинет"
        title="Мои объявления"
        description="Создавайте черновики, улучшайте качество и публикуйте объявления. Игровой эффект появляется только после реальных полезных действий."
        action={
          <Link className="marketplace-button" to="/marketplace/new">
            Новое объявление
          </Link>
        }
      />

      {listings.isPending ? (
        <div className="marketplace-state">Загружаем ваши объявления…</div>
      ) : listings.isError ? (
        <div className="marketplace-state marketplace-state--error">
          Не удалось получить объявления.
        </div>
      ) : listings.data.items.length === 0 ? (
        <div className="marketplace-state">
          У вас пока нет объявлений.
          <Link to="/marketplace/new">Создать первый черновик</Link>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.data.items.map((listing) => (
            <ListingCard
              listing={listing}
              key={listing.id}
              showStatus
              action={
                <Link
                  className="marketplace-small-button"
                  to={`/marketplace/listings/${listing.id}/edit`}
                >
                  Управлять
                </Link>
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default MyListingsPage
