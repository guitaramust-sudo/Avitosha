import { useState } from 'react'
import { Link } from 'react-router-dom'

import './ListingGallery.scss'

interface ListingGalleryProps {
  href?: string
  photoUrls: string[]
  showThumbnails?: boolean
  title: string
  variant?: 'card' | 'detail'
}

function ListingGallery({
  href,
  photoUrls,
  showThumbnails = false,
  title,
  variant = 'card',
}: ListingGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<string[]>([])
  const photosCount = photoUrls.length
  const activePhotoIndex = Math.min(
    selectedPhotoIndex,
    Math.max(0, photosCount - 1),
  )
  const activePhoto = photoUrls[activePhotoIndex]
  const hasMultiplePhotos = photosCount > 1
  const hasActivePhotoError = Boolean(
    activePhoto && failedPhotoUrls.includes(activePhoto),
  )

  const showPreviousPhoto = () => {
    setSelectedPhotoIndex(
      activePhotoIndex === 0 ? photosCount - 1 : activePhotoIndex - 1,
    )
  }

  const showNextPhoto = () => {
    setSelectedPhotoIndex(
      activePhotoIndex === photosCount - 1 ? 0 : activePhotoIndex + 1,
    )
  }

  const photoContent =
    activePhoto && !hasActivePhotoError ? (
      <img
        src={activePhoto}
        alt={`${title} — фото ${activePhotoIndex + 1} из ${photosCount}`}
        loading={variant === 'card' ? 'lazy' : 'eager'}
        onError={() =>
          setFailedPhotoUrls((current) =>
            current.includes(activePhoto) ? current : [...current, activePhoto],
          )
        }
      />
    ) : (
      <span className="listing-gallery__empty">
        {activePhoto ? 'Изображение недоступно' : 'Фотография не добавлена'}
      </span>
    )

  return (
    <div className={`listing-gallery listing-gallery--${variant}`}>
      {href ? (
        <Link className="listing-gallery__main" to={href}>
          {photoContent}
        </Link>
      ) : (
        <div className="listing-gallery__main">{photoContent}</div>
      )}

      {hasMultiplePhotos && (
        <>
          <button
            className="listing-gallery__arrow listing-gallery__arrow--previous"
            type="button"
            aria-label="Предыдущая фотография"
            onClick={showPreviousPhoto}
          >
            ‹
          </button>
          <button
            className="listing-gallery__arrow listing-gallery__arrow--next"
            type="button"
            aria-label="Следующая фотография"
            onClick={showNextPhoto}
          >
            ›
          </button>
          <span className="listing-gallery__counter" aria-live="polite">
            {activePhotoIndex + 1} / {photosCount}
          </span>
        </>
      )}

      {showThumbnails && hasMultiplePhotos && (
        <div className="listing-gallery__thumbnails" aria-label="Фотографии">
          {photoUrls.map((photoUrl, index) => (
            <button
              className={index === activePhotoIndex ? 'is-active' : ''}
              type="button"
              aria-label={`Показать фото ${index + 1} из ${photosCount}`}
              aria-current={index === activePhotoIndex ? 'true' : undefined}
              key={`${photoUrl}-${index}`}
              onClick={() => setSelectedPhotoIndex(index)}
            >
              <img src={photoUrl} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ListingGallery
