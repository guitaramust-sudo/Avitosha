import Character from '../Character/Character'

import './RoomStage.scss'

const roomSlots = [
  { level: 3, position: 'desk' },
  { level: 5, position: 'poster' },
  { level: 7, position: 'shelf' },
  { level: 2, position: 'floor' },
]

function RoomStage() {
  return (
    <section className="room-stage" aria-label="Комната Авитоши">
      <div className="room-stage__placeholder" aria-hidden="true">
        <span>Комната появится здесь</span>
      </div>

      {roomSlots.map((slot) => (
        <div
          className={`room-slot room-slot--${slot.position}`}
          key={slot.position}
          aria-label={`Предмет откроется на уровне ${slot.level}`}
        >
          <span>▣ Ур. {slot.level}</span>
        </div>
      ))}

      <div className="room-stage__character">
        <Character />
      </div>
    </section>
  )
}

export default RoomStage
