import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '../../api/client'
import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import ListingForm from '../../components/ListingForm/ListingForm'
import { useCreateListing } from '../../hooks/useMarketplace'
import type { ListingWriteRequest } from '../../types/marketplace'

import '../marketplace-pages.scss'

function ListingCreatePage() {
  const navigate = useNavigate()
  const createListing = useCreateListing()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (request: ListingWriteRequest) => {
    setError(null)
    try {
      const listing = await createListing.mutateAsync(request)
      void navigate(`/marketplace/listings/${listing.id}/edit`)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Не удалось создать черновик.',
      )
    }
  }

  return (
    <section className="marketplace-page marketplace-page--form">
      <GamePageHeader
        eyebrow="Новый черновик"
        title="Создать объявление"
        description="Создание черновика не начисляет XP. Заполните критерии качества и опубликуйте объявление, чтобы продвинуть задание."
      />
      {error && <p className="marketplace-error">{error}</p>}
      <ListingForm
        isPending={createListing.isPending}
        onSubmit={(request) => void handleSubmit(request)}
        submitLabel="Создать черновик"
      />
    </section>
  )
}

export default ListingCreatePage
