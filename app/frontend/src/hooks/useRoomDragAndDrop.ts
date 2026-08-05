import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useCallback, useEffect, useMemo } from 'react'

import {
  beginRoomItemDrag,
  endRoomItemDrag,
  nudgeRoomItem,
  placeRoomItem,
  resetRoomLayout,
  selectRoomItem,
  syncRoomLayout,
} from '../store/roomEditorSlice'
import { isRoomItemCode, type RoomItem, type RoomItemCode } from '../types/game'
import { getDefaultRoomPosition, type RoomPosition } from '../utils/roomLayout'
import { useAppDispatch, useAppSelector } from './redux'

export const ROOM_DROP_ID = 'room-stage'

export const snapRoomItemCenterToCursor: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  if (!(activatorEvent instanceof PointerEvent) || !draggingNodeRect) {
    return transform
  }

  return {
    ...transform,
    x:
      transform.x +
      activatorEvent.clientX -
      (draggingNodeRect.left + draggingNodeRect.width / 2),
    y:
      transform.y +
      activatorEvent.clientY -
      (draggingNodeRect.top + draggingNodeRect.height / 2),
  }
}

interface DragData {
  code: RoomItemCode
  source: 'collection' | 'stage'
}

const getDragData = (event: DragStartEvent | DragEndEvent): DragData | null => {
  const data = event.active.data.current

  if (
    data &&
    typeof data.code === 'string' &&
    isRoomItemCode(data.code) &&
    (data.source === 'collection' || data.source === 'stage')
  ) {
    return data as DragData
  }

  return null
}

export const useRoomLayoutSync = (
  ownerId: string | undefined,
  items: RoomItem[],
) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (ownerId) {
      dispatch(syncRoomLayout({ items, ownerId }))
    }
  }, [dispatch, items, ownerId])
}

export const useRoomDragAndDrop = (items: RoomItem[]) => {
  const dispatch = useAppDispatch()
  const draggingItemCode = useAppSelector(
    (state) => state.roomEditor.draggingItemCode,
  )
  const availableCodes = useMemo(
    () =>
      new Set(
        items
          .filter((item) => item.status !== 'LOCKED')
          .map((item) => item.code),
      ),
    [items],
  )
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = getDragData(event)

      if (data && availableCodes.has(data.code)) {
        dispatch(beginRoomItemDrag(data.code))
      }
    },
    [availableCodes, dispatch],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const data = getDragData(event)
      const itemRect = event.active.rect.current.translated
      const roomRect = event.over?.rect

      if (
        data &&
        availableCodes.has(data.code) &&
        event.over?.id === ROOM_DROP_ID &&
        itemRect &&
        roomRect
      ) {
        dispatch(
          placeRoomItem({
            code: data.code,
            position: {
              x:
                ((itemRect.left + itemRect.width / 2 - roomRect.left) /
                  roomRect.width) *
                100,
              y:
                ((itemRect.top + itemRect.height / 2 - roomRect.top) /
                  roomRect.height) *
                100,
            },
          }),
        )
        return
      }

      dispatch(endRoomItemDrag())
    },
    [availableCodes, dispatch],
  )

  const handleDragCancel = useCallback(() => {
    dispatch(endRoomItemDrag())
  }, [dispatch])

  return {
    draggingItemCode,
    handleDragCancel,
    handleDragEnd,
    handleDragStart,
    sensors,
  }
}

export const useRoomItemControls = (items: RoomItem[]) => {
  const dispatch = useAppDispatch()
  const placements = useAppSelector((state) => state.roomEditor.placements)
  const selectedItemCode = useAppSelector(
    (state) => state.roomEditor.selectedItemCode,
  )
  const hasLayoutChanges = items.some((item, index) => {
    const position = placements[item.code]

    if (!position) {
      return false
    }

    const defaultPosition = getDefaultRoomPosition(item.positionKey, index)
    return position.x !== defaultPosition.x || position.y !== defaultPosition.y
  })

  useEffect(() => {
    if (!selectedItemCode) {
      return
    }

    const clearSelection = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        dispatch(selectRoomItem(null))
      }
    }

    window.addEventListener('keydown', clearSelection)
    return () => window.removeEventListener('keydown', clearSelection)
  }, [dispatch, selectedItemCode])

  const selectItem = useCallback(
    (code: RoomItemCode | null) => dispatch(selectRoomItem(code)),
    [dispatch],
  )
  const resetLayout = useCallback(
    () => dispatch(resetRoomLayout(items)),
    [dispatch, items],
  )
  const placeAtPoint = useCallback(
    (
      code: RoomItemCode,
      point: { clientX: number; clientY: number },
      rect: DOMRect,
    ) => {
      const position: RoomPosition = {
        x: ((point.clientX - rect.left) / rect.width) * 100,
        y: ((point.clientY - rect.top) / rect.height) * 100,
      }
      dispatch(placeRoomItem({ code, position }))
    },
    [dispatch],
  )
  const nudgeItem = useCallback(
    (code: RoomItemCode, key: string) => {
      const deltas: Record<string, RoomPosition> = {
        ArrowDown: { x: 0, y: 2 },
        ArrowLeft: { x: -2, y: 0 },
        ArrowRight: { x: 2, y: 0 },
        ArrowUp: { x: 0, y: -2 },
      }
      const delta = deltas[key]

      if (delta) {
        dispatch(nudgeRoomItem({ code, delta }))
        return true
      }

      return false
    },
    [dispatch],
  )

  return {
    hasLayoutChanges,
    nudgeItem,
    placeAtPoint,
    placements,
    resetLayout,
    selectedItemCode,
    selectItem,
  }
}
