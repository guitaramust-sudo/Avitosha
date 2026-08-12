import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import ListingCard from '../../components/ListingCard/ListingCard'
import { useAppSelector } from '../../hooks/redux'
import { useListingCategories, useListings } from '../../hooks/useMarketplace'

import '../marketplace-pages.scss'

const PAGE_SIZE = 20

function MarketplaceCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('query') ?? '')
  const category = searchParams.get('category') ?? ''
  const offset = Number(searchParams.get('offset') ?? 0)
  const query = searchParams.get('query') ?? ''
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const categories = useListingCategories()
  const listings = useListings({ category, limit: PAGE_SIZE, offset, query })

  const updateFilters = (next: {
    category?: string
    offset?: number
    query?: string
  }) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === 0) params.delete(key)
      else params.set(key, String(value))
    })
    setSearchParams(params)
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateFilters({ offset: 0, query: search.trim() })
  }

  return (
    <section className="marketplace-page">
      <GamePageHeader
        eyebrow="Mini-Avito"
        title="Объявления"
        description="Ищите интересные предложения и развивайте Авитошу реальными действиями: просмотрами, избранным и общением с продавцами."
        action={
          isAuthenticated ? (
            <Link className="marketplace-button" to="/marketplace/new">
              Разместить объявление
            </Link>
          ) : undefined
        }
      />

      <aside className="marketplace-note">
        <span aria-hidden="true">⌘</span>
        <div>
          <strong>Зачем здесь питомец</strong>
          <p>
            Полезные действия с объявлениями двигают задания, развивают характер
            Авитоши и открывают предметы комнаты. Результат появится в игровом
            кабинете автоматически.
          </p>
        </div>
      </aside>

      <form className="marketplace-search" onSubmit={submitSearch}>
        <span aria-hidden="true">⌕</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
        />
        <button type="submit">Найти</button>
      </form>

      <div className="marketplace-categories" aria-label="Категории">
        <button
          className={category ? '' : 'is-active'}
          type="button"
          onClick={() => updateFilters({ category: '', offset: 0 })}
        >
          Все
        </button>
        {(categories.data ?? []).map((item) => (
          <button
            className={category === item.code ? 'is-active' : ''}
            type="button"
            key={item.code}
            onClick={() => updateFilters({ category: item.code, offset: 0 })}
          >
            {item.name}
          </button>
        ))}
      </div>

      {listings.isPending ? (
        <div className="marketplace-state">Загружаем объявления…</div>
      ) : listings.isError ? (
        <div className="marketplace-state marketplace-state--error">
          Не удалось загрузить каталог.
          <button type="button" onClick={() => void listings.refetch()}>
            Повторить
          </button>
        </div>
      ) : listings.data.items.length === 0 ? (
        <div className="marketplace-state">
          По вашему запросу ничего не найдено.
        </div>
      ) : (
        <>
          <div className="listing-grid">
            {listings.data.items.map((listing) => (
              <ListingCard listing={listing} key={listing.id} />
            ))}
          </div>
          <div className="marketplace-pagination">
            <button
              type="button"
              disabled={offset === 0}
              onClick={() =>
                updateFilters({ offset: Math.max(0, offset - PAGE_SIZE) })
              }
            >
              ← Назад
            </button>
            <span>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, listings.data.total)}{' '}
              из {listings.data.total}
            </span>
            <button
              type="button"
              disabled={offset + PAGE_SIZE >= listings.data.total}
              onClick={() => updateFilters({ offset: offset + PAGE_SIZE })}
            >
              Далее →
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default MarketplaceCatalogPage
