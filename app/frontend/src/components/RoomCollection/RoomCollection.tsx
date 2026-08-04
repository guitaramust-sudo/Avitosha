import './RoomCollection.scss'

const roomItems = [
  { name: 'Стол', unlocked: true },
  { name: 'Лампа', unlocked: true },
  { name: 'Стул', unlocked: true },
  { name: 'Растение', unlocked: true },
  { name: 'Постер', unlocked: false },
  { name: 'Копилка', unlocked: false },
  { name: 'Машинка', unlocked: false },
  { name: 'Коробка', unlocked: false },
  { name: 'Чемодан', unlocked: false },
]

function RoomCollection() {
  return (
    <section className="room-collection">
      <h2>Коллекция комнаты</h2>
      <div className="room-collection__items">
        {roomItems.map((item) => (
          <button
            className="collection-item"
            type="button"
            disabled={!item.unlocked}
            key={item.name}
          >
            <span className="collection-item__state" aria-hidden="true">
              {item.unlocked ? '✓' : '▣'}
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
