import { type ChangeEvent, type FormEvent, useState } from 'react'

import { ApiError } from '../../api/client'
import {
  useListingCategories,
  useUploadListingPhotos,
} from '../../hooks/useMarketplace'
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
  const uploadPhotos = useUploadListingPhotos()
  const [categoryCode, setCategoryCode] = useState(
    initialListing?.categoryCode ?? '',
  )
  const [description, setDescription] = useState(
    initialListing?.description ?? '',
  )
  const [photoUrls, setPhotoUrls] = useState(initialListing?.photoUrls ?? [])
  const [price, setPrice] = useState(
    initialListing ? String(initialListing.priceKopecks / 100) : '',
  )
  const [title, setTitle] = useState(initialListing?.title ?? '')
  const [photoUrlsError, setPhotoUrlsError] = useState<string | null>(null)

  const selectedCategory = categoryCode || categories.data?.[0]?.code || ''

  const handlePhotoSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return
    if (photoUrls.length + files.length > 10) {
      setPhotoUrlsError('Можно добавить не больше 10 фотографий.')
      return
    }
    if (
      files.some(
        (file) =>
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
          file.size > 10 * 1024 * 1024,
      )
    ) {
      setPhotoUrlsError('Выберите JPEG, PNG или WebP размером не больше 10 МБ.')
      return
    }

    setPhotoUrlsError(null)
    try {
      const uploadedUrls = await uploadPhotos.mutateAsync(files)
      setPhotoUrls((current) => [...current, ...uploadedUrls])
    } catch (error) {
      setPhotoUrlsError(
        error instanceof ApiError
          ? error.message
          : 'Не удалось загрузить фотографию. Попробуйте ещё раз.',
      )
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setPhotoUrlsError(null)
    onSubmit({
      categoryCode: selectedCategory,
      description,
      photoUrls,
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
      <label
        className={`listing-form__wide ${photoUrlsError ? 'has-error' : ''}`}
      >
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
      <div className="listing-form__wide listing-form__photo-field">
        <span>Фотографии</span>
        {photoUrls.length > 0 && (
          <div className="listing-form__photos">
            {photoUrls.map((url) => (
              <figure key={url}>
                <img src={url} alt="Фотография объявления" />
                <button
                  type="button"
                  aria-label="Удалить фотографию"
                  onClick={() =>
                    setPhotoUrls((current) =>
                      current.filter((photoUrl) => photoUrl !== url),
                    )
                  }
                >
                  ×
                </button>
              </figure>
            ))}
          </div>
        )}
        <label className="listing-form__photo-upload">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploadPhotos.isPending || photoUrls.length >= 10}
            aria-describedby="photo-urls-help photo-urls-error"
            aria-invalid={Boolean(photoUrlsError)}
            onChange={handlePhotoSelection}
          />
          <span>
            {uploadPhotos.isPending ? 'Загружаем…' : 'Выбрать фотографии'}
          </span>
        </label>
        <small id="photo-urls-help">
          До 10 файлов JPEG, PNG или WebP, не больше 10 МБ каждый.
        </small>
        {photoUrlsError && (
          <strong className="listing-form__error" id="photo-urls-error">
            {photoUrlsError}
          </strong>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending || uploadPhotos.isPending || !selectedCategory}
      >
        {isPending ? 'Сохраняем…' : submitLabel}
      </button>
    </form>
  )
}

export default ListingForm
