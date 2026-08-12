import { type FormEvent, useState } from 'react'

import { useListingCategories } from '../../hooks/useMarketplace'
import type { Listing, ListingWriteRequest } from '../../types/marketplace'

import './ListingForm.scss'

interface ListingFormProps {
  initialListing?: Listing
  isPending: boolean
  onSubmit: (request: ListingWriteRequest) => void
  submitLabel: string
}

function ListingForm({
  initialListing,
  isPending,
  onSubmit,
  submitLabel,
}: ListingFormProps) {
  const categories = useListingCategories()
  const [categoryCode, setCategoryCode] = useState(
    initialListing?.categoryCode ?? '',
  )
  const [description, setDescription] = useState(
    initialListing?.description ?? '',
  )
  const [photoUrls, setPhotoUrls] = useState(
    initialListing?.photoUrls.join('\n') ?? '',
  )
  const [price, setPrice] = useState(
    initialListing ? String(initialListing.priceKopecks / 100) : '',
  )
  const [title, setTitle] = useState(initialListing?.title ?? '')

  const selectedCategory = categoryCode || categories.data?.[0]?.code || ''

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      categoryCode: selectedCategory,
      description,
      photoUrls: photoUrls
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean),
      priceKopecks: Math.max(0, Math.round(Number(price || 0) * 100)),
      title: title.trim(),
    })
  }

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <label>
        <span>Категория</span>
        <select
          value={selectedCategory}
          onChange={(event) => setCategoryCode(event.target.value)}
          required
        >
          {(categories.data ?? []).map((category) => (
            <option value={category.code} key={category.code}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Название</span>
        <input
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например, удобное кресло"
          required
        />
      </label>
      <label>
        <span>Цена, ₽</span>
        <input
          min="0"
          step="1"
          type="number"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>
      <label className="listing-form__wide">
        <span>Описание</span>
        <textarea
          maxLength={5000}
          rows={8}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Подробно расскажите о состоянии, особенностях и условиях передачи"
        />
        <small>{description.length}/150 символов до критерия качества</small>
      </label>
      <label className="listing-form__wide">
        <span>Ссылки на фотографии</span>
        <textarea
          rows={4}
          value={photoUrls}
          onChange={(event) => setPhotoUrls(event.target.value)}
          placeholder="Одна ссылка на строку"
        />
        <small>До 10 внешних URL. Загрузка файлов в MVP не используется.</small>
      </label>
      <button type="submit" disabled={isPending || !selectedCategory}>
        {isPending ? 'Сохраняем…' : submitLabel}
      </button>
    </form>
  )
}

export default ListingForm
