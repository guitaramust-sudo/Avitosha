import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import ListingCard from '../../components/ListingCard/ListingCard'
import {
  useFavoriteListings,
  useRemoveFavorite,
} from '../../hooks/useMarketplace'

import '../marketplace-pages.scss'

function FavoritesPage() {
  const favorites = useFavoriteListings()
  const removeFavorite = useRemoveFavorite()

  return (
    <section className="marketplace-page">
      <GamePageHeader
        eyebrow="Сохранённое"
        title="Избранное"
        description="Возвращайтесь к интересным предложениям и продолжайте путь Авитоши с того места, где остановились."
      />

      {favorites.isPending ? (
        <div className="marketplace-state">Загружаем избранное…</div>
      ) : favorites.isError ? (
        <div className="marketplace-state marketplace-state--error">
          Не удалось получить избранное.
        </div>
      ) : favorites.data.items.length === 0 ? (
        <div className="marketplace-state">В избранном пока ничего нет.</div>
      ) : (
        <div className="listing-grid">
          {favorites.data.items.map((listing) => (
            <ListingCard
              listing={listing}
              key={listing.id}
              action={
                <button
                  className="marketplace-small-button marketplace-small-button--muted"
                  type="button"
                  disabled={removeFavorite.isPending}
                  onClick={() => removeFavorite.mutate(listing.id)}
                >
                  Удалить
                </button>
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default FavoritesPage
