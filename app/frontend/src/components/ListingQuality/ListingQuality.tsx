import type { ListingQuality as ListingQualityType } from '../../types/marketplace'

import './ListingQuality.scss'

const qualityLabels = {
  description: 'Описание от 150 символов',
  photo: 'Хотя бы одна фотография',
  price: 'Цена больше нуля',
} as const

function ListingQuality({ quality }: { quality: ListingQualityType }) {
  return (
    <section className="listing-quality">
      <div>
        <span>Качество объявления</span>
        <strong>{quality.score}/3</strong>
      </div>
      <span className="listing-quality__progress" aria-hidden="true">
        <i style={{ width: `${(quality.score / 3) * 100}%` }} />
      </span>
      <ul>
        {(Object.keys(qualityLabels) as Array<keyof typeof qualityLabels>).map(
          (field) => {
            const missing = quality.missingFields.includes(field)
            return (
              <li className={missing ? '' : 'is-complete'} key={field}>
                <span>{missing ? '○' : '✓'}</span>
                {qualityLabels[field]}
              </li>
            )
          },
        )}
      </ul>
      <p>{quality.nextActionHint}</p>
    </section>
  )
}

export default ListingQuality
