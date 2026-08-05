import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'

import { useAppSelector } from '../../hooks/redux'
import {
  ROOM_DROP_ID,
  useRoomItemControls,
} from '../../hooks/useRoomDragAndDrop'
import {
  selectGamePet,
  selectGameRoom,
  selectGameStory,
} from '../../store/gameSlice'
import type { RoomItem, RoomItemCode } from '../../types/game'
import {
  getDefaultRoomPosition,
  roomItemImages,
  roomItemStageWidths,
  type RoomPosition,
} from '../../utils/roomLayout'
import Character from '../Character/Character'

import './RoomStage.scss'

const emptyRoomItems: RoomItem[] = []

interface RoomObjectProps {
  isSelected: boolean
  item: RoomItem
  onNudge: (code: RoomItemCode, key: string) => boolean
  onSelect: (code: RoomItemCode) => void
  position: RoomPosition
}

type RoomObjectStyle = CSSProperties & {
  '--room-item-width': string
}

function RoomObject({
  isSelected,
  item,
  onNudge,
  onSelect,
  position,
}: RoomObjectProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({
      id: `stage:${item.code}`,
      data: { code: item.code, source: 'stage' },
    })
  const style: RoomObjectStyle = {
    '--room-item-width': `${roomItemStageWidths[item.code]}px`,
    left: `${position.x}%`,
    top: `${position.y}%`,
    ...(transform
      ? {
          transform: `translate3d(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px), 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`,
        }
      : {}),
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isDragging && onNudge(item.code, event.key)) {
      event.preventDefault()
      return
    }

    listeners?.onKeyDown?.(event)
  }

  return (
    <button
      ref={setNodeRef}
      className={`room-object room-object--${item.code.toLowerCase()} ${item.status === 'PLACED' ? 'is-placed' : 'is-unlocked'} ${isSelected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      type="button"
      data-asset-key={item.assetKey}
      data-room-object={item.code}
      title={`${item.description}. Предмет можно перемещать локально.`}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(item.code)
      }}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
    >
      <img src={roomItemImages[item.code]} alt="" />
    </button>
  )
}

function RoomStage() {
  const pet = useAppSelector(selectGamePet)
  const room = useAppSelector(selectGameRoom)
  const story = useAppSelector(selectGameStory)
  const items = room?.items ?? emptyRoomItems
  const { isOver, setNodeRef } = useDroppable({ id: ROOM_DROP_ID })
  const { nudgeItem, placeAtPoint, placements, selectedItemCode, selectItem } =
    useRoomItemControls(items)

  if (!pet || !room || !story) {
    return null
  }

  const visibleItems = items.filter(
    (item) => item.status === 'PLACED' || placements[item.code],
  )
  const phrase =
    story.status === 'COMPLETED'
      ? null
      : story.nextTask
        ? `Следующая цель: ${story.nextTask.title}`
        : 'Давай обустроим нашу первую комнату!'
  const selectedItem = items.find(
    (item) => item.code === selectedItemCode && item.status !== 'LOCKED',
  )
  const handleRoomClick = (event: MouseEvent<HTMLElement>) => {
    if (!selectedItem || event.target !== event.currentTarget) {
      return
    }

    placeAtPoint(
      selectedItem.code,
      event,
      event.currentTarget.getBoundingClientRect(),
    )
  }

  return (
    <section
      ref={setNodeRef}
      className={`room-stage ${isOver ? 'is-drop-target' : ''}`}
      aria-label="Комната Авитоши. Перетаскивайте открытые предметы для размещения."
      onClick={handleRoomClick}
    >
      <div className="room-stage__story">
        <small>Обустроить комнату</small>
        <strong>
          {story.currentStage}/{story.totalStages} этапов
        </strong>
        <span>{story.description}</span>
      </div>

      {visibleItems.map((item) => {
        const itemIndex = items.findIndex(({ code }) => code === item.code)

        return (
          <RoomObject
            key={item.code}
            item={item}
            position={
              placements[item.code] ??
              getDefaultRoomPosition(item.positionKey, itemIndex)
            }
            isSelected={selectedItemCode === item.code}
            onNudge={nudgeItem}
            onSelect={selectItem}
          />
        )
      })}

      {phrase && <div className="room-stage__speech">{phrase}</div>}
      {selectedItem && (
        <div className="room-stage__edit-hint">
          Выбран: {selectedItem.name}. Нажмите на свободное место.
        </div>
      )}
      <div className="room-stage__character" data-mood={pet.mood}>
        <Character />
      </div>
      <span className="room-stage__placed-count">
        {room.progress} предметов
      </span>
    </section>
  )
}

export default RoomStage
