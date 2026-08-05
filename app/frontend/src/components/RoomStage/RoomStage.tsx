import type { PetProfile, RoomItem, StoryResponse } from '../../types/game'
import Character from '../Character/Character'

import './RoomStage.scss'

const itemIcons: Record<string, string> = {
  BOX: '▣',
  DESK: '▰',
  LAMP: '◉',
  CHAIR: '♨',
  PLANT: '♣',
  POSTER: '▤',
  PIGGY_BANK: '◍',
  TOY_CAR: '▱',
  SUITCASE: '▥',
}

interface RoomStageProps {
  pet: PetProfile
  items: RoomItem[]
  story: StoryResponse
}

function RoomStage({ pet, items, story }: RoomStageProps) {
  const placedItems = items.filter((item) => item.status === 'PLACED')
  const phrase =
    story.status === 'COMPLETED'
      ? 'Комната готова! Теперь я чувствую себя как дома.'
      : story.nextTask
        ? `Следующая цель: ${story.nextTask.title}`
        : 'Давай обустроим нашу первую комнату!'

  return (
    <section className="room-stage" aria-label="Комната Авитоши">
      <div className="room-stage__story">
        <small>{story.title}</small>
        <strong>
          {story.currentStage}/{story.totalStages} этапов
        </strong>
      </div>

      {items.map((item) => (
        <div
          className={`room-object room-object--${item.positionKey} ${item.status === 'PLACED' ? 'is-placed' : 'is-locked'}`}
          key={item.code}
          title={
            item.status === 'PLACED'
              ? item.description
              : `Откроется после задания ${item.unlockTaskCode ?? ''}`
          }
        >
          <span aria-hidden="true">{itemIcons[item.code] ?? '◇'}</span>
          <small>{item.name}</small>
        </div>
      ))}

      <div className="room-stage__speech">{phrase}</div>
      <div className="room-stage__character" data-mood={pet.mood}>
        <Character />
        {pet.characterProfile.unlocked && (
          <span className="character-detail">
            {pet.characterProfile.visualDetail} · {pet.characterProfile.name}
          </span>
        )}
      </div>
      <span className="room-stage__placed-count">
        {placedItems.length}/{items.length} предметов
      </span>
    </section>
  )
}

export default RoomStage
