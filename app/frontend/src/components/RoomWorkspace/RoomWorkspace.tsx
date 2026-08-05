import { DndContext, DragOverlay, rectIntersection } from '@dnd-kit/core'

import { useAppSelector } from '../../hooks/redux'
import {
  snapRoomItemCenterToCursor,
  useRoomDragAndDrop,
  useRoomLayoutSync,
} from '../../hooks/useRoomDragAndDrop'
import { selectGameRoom } from '../../store/gameSlice'
import type { RoomItem } from '../../types/game'
import { roomItemImages } from '../../utils/roomLayout'
import RoomCollection from '../RoomCollection/RoomCollection'
import RoomStage from '../RoomStage/RoomStage'

import './RoomWorkspace.scss'

const emptyRoomItems: RoomItem[] = []

function RoomWorkspace() {
  const ownerId = useAppSelector((state) => state.auth.user?.id)
  const room = useAppSelector(selectGameRoom)
  const items = room?.items ?? emptyRoomItems
  useRoomLayoutSync(ownerId, items)
  const {
    draggingItemCode,
    handleDragCancel,
    handleDragEnd,
    handleDragStart,
    sensors,
  } = useRoomDragAndDrop(items)
  const activeItem = items.find((item) => item.code === draggingItemCode)

  return (
    <DndContext
      sensors={sensors}
      modifiers={[snapRoomItemCenterToCursor]}
      collisionDetection={rectIntersection}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <RoomStage />
      <RoomCollection />

      <DragOverlay>
        {activeItem ? (
          <div className="room-drag-overlay">
            <img src={roomItemImages[activeItem.code]} alt="" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default RoomWorkspace
