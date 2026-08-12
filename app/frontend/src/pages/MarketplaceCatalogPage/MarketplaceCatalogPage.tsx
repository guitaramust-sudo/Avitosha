import { type FormEvent, useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import ListingCard from '../../components/ListingCard/ListingCard'
import { useAppSelector } from '../../hooks/redux'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import {
  useInfiniteListings,
  useListingCategories,
} from '../../hooks/useMarketplace'

import '../marketplace-pages.scss'

const PAGE_SIZE = 20

function MarketplaceCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('query') ?? '')
  const category = searchParams.get('category') ?? ''
  const query = searchParams.get('query') ?? ''
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const categories = useListingCategories()
  const listings = useInfiniteListings({
    category,
    limit: PAGE_SIZE,
    query,
  })
  const loadedListings = useMemo(
    () => listings.data?.pages.flatMap((page) => page.items) ?? [],
    [listings.data?.pages],
  )
  const total = listings.data?.pages[0]?.total ?? 0

  const loadNextPage = useCallback(() => {
    if (listings.hasNextPage && !listings.isFetchingNextPage) {
      void listings.fetchNextPage()
    }
  }, [listings])
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(
      listings.hasNextPage &&
      !listings.isFetchingNextPage &&
      !listings.isFetchNextPageError,
    ),
    onLoadMore: loadNextPage,
  })

  const updateFilters = (next: { category?: string; query?: string }) => {
    const params = new URLSearchParams(searchParams)
    params.delete('offset')
    Object.entries(next).forEach(([key, value]) => {
      if (value === '' || value === undefined) params.delete(key)
      else params.set(key, value)
    })
    setSearchParams(params)
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateFilters({ query: search.trim() })
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
          onClick={() => updateFilters({ category: '' })}
        >
          Все
        </button>
        {(categories.data ?? []).map((item) => (
          <button
            className={category === item.code ? 'is-active' : ''}
            type="button"
            key={item.code}
            onClick={() => updateFilters({ category: item.code })}
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
      ) : loadedListings.length === 0 ? (
        <div className="marketplace-state">
          По вашему запросу ничего не найдено.
        </div>
      ) : (
        <>
          <div className="listing-grid">
            {loadedListings.map((listing) => (
              <ListingCard listing={listing} key={listing.id} />
            ))}
          </div>

          <div className="marketplace-load-more" ref={loadMoreRef}>
            {listings.isFetchingNextPage ? (
              <span>Загружаем ещё объявления…</span>
            ) : listings.isFetchNextPageError ? (
              <>
                <span>Не удалось загрузить следующую страницу.</span>
                <button type="button" onClick={loadNextPage}>
                  Повторить
                </button>
              </>
            ) : listings.hasNextPage ? (
              <button type="button" onClick={loadNextPage}>
                Показать ещё
              </button>
            ) : (
              <span>
                Показано {Math.min(loadedListings.length, total)} из {total}
              </span>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default MarketplaceCatalogPage
