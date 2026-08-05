import type { RoomItem } from '../../types/game'

import './RoomCollection.scss'

interface RoomCollectionProps {
  items: RoomItem[]
}

function RoomCollection({ items }: RoomCollectionProps) {
  return (
    <section className="room-collection">
      <h2>Коллекция комнаты</h2>
      <div className="room-collection__items">
        {items.map((item) => (
          <button
            className="collection-item"
            type="button"
            disabled={item.status === 'LOCKED'}
            title={
              item.status === 'LOCKED'
                ? `Откроется после ${item.unlockTaskCode ?? 'будущего задания'}`
                : item.description
            }
            key={item.code}
          >
            <span className="collection-item__state" aria-hidden="true">
              {item.status === 'LOCKED' ? '▣' : '✓'}
            </span>
            <span className="collection-item__placeholder" aria-hidden="true" />
            <span className="collection-item__name">{item.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default RoomCollection
