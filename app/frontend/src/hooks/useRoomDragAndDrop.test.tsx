import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'

import { syncRoomLayout } from '../store/roomEditorSlice'
import { createAppStore } from '../store/store'
import type { RoomItem } from '../types/game'
import { ROOM_DROP_ID, useRoomDragAndDrop } from './useRoomDragAndDrop'

const items: RoomItem[] = [
  {
    code: 'BOX',
    name: 'Коробка',
    description: 'Первая коробка',
    status: 'PLACED',
    assetKey: 'room.box',
    positionKey: 'box',
    unlockTaskCode: null,
  },
  {
    code: 'DESK',
    name: 'Стол',
    description: 'Рабочий стол',
    status: 'LOCKED',
    assetKey: 'room.desk',
    positionKey: 'desk',
    unlockTaskCode: 'VIEW_FURNITURE_ADS',
  },
]

const dragStartEvent = (code: string): DragStartEvent =>
  ({
    active: {
      data: { current: { code, source: 'collection' } },
    },
  }) as unknown as DragStartEvent

const dragEndEvent = (code: string): DragEndEvent =>
  ({
    active: {
      data: { current: { code, source: 'collection' } },
      rect: {
        current: {
          translated: { left: 400, top: 200, width: 80, height: 60 },
        },
      },
    },
    over: {
      id: ROOM_DROP_ID,
      rect: { left: 100, top: 100, width: 600, height: 400 },
    },
  }) as unknown as DragEndEvent

describe('useRoomDragAndDrop', () => {
  it('stores a dropped room position in Redux', () => {
    const store = createAppStore()
    store.dispatch(syncRoomLayout({ items, ownerId: 'user-1' }))
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(() => useRoomDragAndDrop(items), { wrapper })

    act(() => result.current.handleDragStart(dragStartEvent('BOX')))
    expect(store.getState().roomEditor.draggingItemCode).toBe('BOX')

    act(() => result.current.handleDragEnd(dragEndEvent('BOX')))

    expect(store.getState().roomEditor.placements.BOX?.x).toBeCloseTo(56.67)
    expect(store.getState().roomEditor.placements.BOX?.y).toBeCloseTo(32.5)
    expect(store.getState().roomEditor.draggingItemCode).toBeNull()
  })

  it('does not start dragging a locked item', () => {
    const store = createAppStore()
    store.dispatch(syncRoomLayout({ items, ownerId: 'user-1' }))
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(() => useRoomDragAndDrop(items), { wrapper })

    act(() => result.current.handleDragStart(dragStartEvent('DESK')))

    expect(store.getState().roomEditor.draggingItemCode).toBeNull()
  })
})
