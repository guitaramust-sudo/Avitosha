import { type ChangeEvent, type FormEvent, useState } from 'react'

import { ApiError } from '../../api/client'
import {
  useListingCategories,
  useUploadListingPhotos,
} from '../../hooks/useMarketplace'
import type {
  Listing,
  ListingQuality,
  ListingWriteRequest,
} from '../../types/marketplace'
import {
  evaluateListingQuality,
  LISTING_DESCRIPTION_MIN_LENGTH,
} from '../../utils/marketplacePresentation'

import './ListingForm.scss'

const MAX_PHOTOS = 10
const MAX_PHOTO_SIZE = 10 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ListingFormProps {
  initialListing?: Listing
  isPending: boolean
  onQualityChange?: (quality: ListingQuality) => void
  onSubmit: (request: ListingWriteRequest) => void
  submitLabel: string
}

function ListingForm({
  initialListing,
  isPending,
  onQualityChange,
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
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [failedPhotoFiles, setFailedPhotoFiles] = useState<File[]>([])

  const selectedCategory = categoryCode || categories.data?.[0]?.code || ''

  const getDraft = (
    changes: Partial<ListingWriteRequest> = {},
  ): ListingWriteRequest => ({
    categoryCode: selectedCategory,
    description,
    photoUrls,
    priceKopecks: Math.max(0, Math.round(Number(price || 0) * 100)),
    title: title.trim(),
    ...changes,
  })

  const updateQuality = (changes: Partial<ListingWriteRequest> = {}) => {
    onQualityChange?.(evaluateListingQuality(getDraft(changes)))
  }

  const uploadFiles = async (files: File[]) => {
    const result = await uploadPhotos.mutateAsync(files)

    if (result.uploadedUrls.length > 0) {
      const nextPhotoUrls = [...photoUrls, ...result.uploadedUrls]
      setPhotoUrls(nextPhotoUrls)
      updateQuality({ photoUrls: nextPhotoUrls })
    }

    setFailedPhotoFiles(result.failedFiles.map(({ file }) => file))
    if (result.failedFiles.length === 0) {
      setPhotoError(null)
      return
    }

    const firstError = result.failedFiles[0]?.error
    setPhotoError(
      result.failedFiles.length === 1 && firstError instanceof ApiError
        ? firstError.message
        : `Не удалось загрузить ${result.failedFiles.length} фото. Попробуйте ещё раз.`,
    )
  }

  const handlePhotoSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    if (photoUrls.length + files.length > MAX_PHOTOS) {
      setPhotoError(`Можно добавить не больше ${MAX_PHOTOS} фотографий.`)
      return
    }

    if (files.some((file) => !PHOTO_TYPES.includes(file.type))) {
      setPhotoError('Поддерживаются только фотографии JPEG, PNG и WebP.')
      return
    }

    if (files.some((file) => file.size === 0 || file.size > MAX_PHOTO_SIZE)) {
      setPhotoError(
        'Фотография не должна быть пустой и превышать размер 10 МБ.',
      )
      return
    }

    setPhotoError(null)
    setFailedPhotoFiles([])
    await uploadFiles(files)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(getDraft())
  }

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <label>
        <span>Категория</span>
        <select
          value={selectedCategory}
          onChange={(event) => {
            setCategoryCode(event.target.value)
            updateQuality({ categoryCode: event.target.value })
          }}
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
          onChange={(event) => {
            setTitle(event.target.value)
            updateQuality({ title: event.target.value.trim() })
          }}
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
          onChange={(event) => {
            const nextPrice = event.target.value
            setPrice(nextPrice)
            updateQuality({
              priceKopecks: Math.max(
                0,
                Math.round(Number(nextPrice || 0) * 100),
              ),
            })
          }}
        />
      </label>

      <label className="listing-form__wide">
        <span>Описание</span>
        <textarea
          maxLength={5000}
          rows={8}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value)
            updateQuality({ description: event.target.value })
          }}
          placeholder="Подробно расскажите о состоянии, особенностях и условиях передачи"
        />
        <small>
          Набрано {description.trim().length}/{LISTING_DESCRIPTION_MIN_LENGTH}{' '}
          символов. Это не обязательно, но рекомендуем подробнее описать товар.
        </small>
      </label>

      <div className="listing-form__wide listing-form__photo-field">
        <div className="listing-form__photo-heading">
          <span>Фотографии</span>
          <small>
            {photoUrls.length}/{MAX_PHOTOS}
          </small>
        </div>

        {photoUrls.length > 0 && (
          <div className="listing-form__photos">
            {photoUrls.map((url, index) => (
              <figure key={url}>
                <img src={url} alt={`Фотография объявления ${index + 1}`} />
                <button
                  type="button"
                  aria-label={`Удалить фотографию ${index + 1}`}
                  onClick={() => {
                    const nextPhotoUrls = photoUrls.filter(
                      (photoUrl) => photoUrl !== url,
                    )
                    setPhotoUrls(nextPhotoUrls)
                    updateQuality({ photoUrls: nextPhotoUrls })
                  }}
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
            accept={PHOTO_TYPES.join(',')}
            multiple
            disabled={uploadPhotos.isPending || photoUrls.length >= MAX_PHOTOS}
            aria-describedby="photo-upload-help photo-upload-error"
            aria-invalid={Boolean(photoError)}
            onChange={(event) => void handlePhotoSelection(event)}
          />
          <span>
            {uploadPhotos.isPending
              ? 'Загружаем фотографии…'
              : photoUrls.length >= MAX_PHOTOS
                ? 'Добавлено максимум фотографий'
                : 'Выбрать фотографии'}
          </span>
        </label>

        <small id="photo-upload-help">
          До 10 файлов JPEG, PNG или WebP, не больше 10 МБ каждый.
        </small>

        {photoError && (
          <strong className="listing-form__error" id="photo-upload-error">
            {photoError}
          </strong>
        )}

        {failedPhotoFiles.length > 0 && (
          <div className="listing-form__failed-uploads">
            <span>
              Не загружены:{' '}
              {failedPhotoFiles.map((file) => file.name).join(', ')}
            </span>
            <button
              type="button"
              disabled={uploadPhotos.isPending}
              onClick={() => void uploadFiles(failedPhotoFiles)}
            >
              Повторить загрузку
            </button>
          </div>
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
