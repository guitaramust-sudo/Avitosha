import { useDraggable } from '@dnd-kit/core'

import { useAppSelector } from '../../hooks/redux'
import { useRoomItemControls } from '../../hooks/useRoomDragAndDrop'
import { selectGameRoom } from '../../store/gameSlice'
import type { RoomItem, RoomItemCode } from '../../types/game'
import { iconAssets } from '../../utils/iconAssets'
import { roomItemImages } from '../../utils/roomLayout'

import './RoomCollection.scss'

const emptyRoomItems: RoomItem[] = []

interface CollectionItemProps {
  isSelected: boolean
  item: RoomItem
  onSelect: (code: RoomItemCode) => void
}

function CollectionItem({ isSelected, item, onSelect }: CollectionItemProps) {
  const isLocked = item.status === 'LOCKED'
  const isPlaced = item.status === 'PLACED'
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: `collection:${item.code}`,
    data: { code: item.code, source: 'collection' },
    disabled: isLocked,
  })

  return (
    <button
      ref={setNodeRef}
      className={`collection-item ${isSelected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
      type="button"
      disabled={isLocked}
      data-asset-key={item.assetKey}
      title={
        isLocked
          ? `Откроется после ${item.unlockTaskCode ?? 'будущего задания'}`
          : `${item.description}. ${
              isPlaced
                ? 'Предмет уже в комнате — его можно переместить.'
                : 'Перетащите предмет в комнату.'
            }`
      }
      onClick={() => onSelect(item.code)}
      {...attributes}
      {...listeners}
      aria-pressed={isSelected}
    >
      <span className="collection-item__state" aria-hidden="true">
        {isLocked ? (
          <img src={iconAssets.lock} alt="" />
        ) : isSelected ? (
          '●'
        ) : isPlaced ? (
          '✓'
        ) : (
          '↕'
        )}
      </span>
      <img
        className="collection-item__image"
        src={roomItemImages[item.code]}
        alt=""
      />
    </button>
  )
}

function RoomCollection() {
  const room = useAppSelector(selectGameRoom)
  const items = room?.items ?? emptyRoomItems
  const { hasLayoutChanges, resetLayout, selectedItemCode, selectItem } =
    useRoomItemControls(items)

  return (
    <section className="room-collection" data-tour="collection">
      <div className="room-collection__heading">
        <div>
          <h2>Коллекция комнаты</h2>
          <p>
            Перетащите открытый предмет или выберите его и нажмите в комнате.
            Расположение меняется только локально.
          </p>
        </div>
        <button
          type="button"
          disabled={!hasLayoutChanges}
          onClick={resetLayout}
        >
          Сбросить расположение
        </button>
      </div>
      <div className="room-collection__items">
        {items.map((item) => (
          <CollectionItem
            key={item.code}
            item={item}
            isSelected={selectedItemCode === item.code}
            onSelect={selectItem}
          />
        ))}
      </div>
    </section>
  )
}

export default RoomCollection
