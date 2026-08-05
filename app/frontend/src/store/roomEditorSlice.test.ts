import { describe, expect, it } from 'vitest'

import type { RoomItem } from '../types/game'
import { clearUser } from './authSlice'
import roomEditorReducer, {
  nudgeRoomItem,
  placeRoomItem,
  resetRoomLayout,
  selectRoomItem,
  syncRoomLayout,
} from './roomEditorSlice'

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

describe('roomEditorSlice', () => {
  it('initializes positions and does not select locked items', () => {
    let state = roomEditorReducer(
      undefined,
      syncRoomLayout({ items, ownerId: 'user-1' }),
    )
    state = roomEditorReducer(state, selectRoomItem('DESK'))
    state = roomEditorReducer(
      state,
      syncRoomLayout({ items, ownerId: 'user-1' }),
    )

    expect(state.placements).toMatchObject({
      BOX: { x: 72, y: 80 },
    })
    expect(state.placements.DESK).toBeUndefined()
    expect(state.selectedItemCode).toBeNull()
  })

  it('places and nudges an available item within room bounds', () => {
    let state = roomEditorReducer(
      undefined,
      syncRoomLayout({ items, ownerId: 'user-1' }),
    )
    state = roomEditorReducer(
      state,
      placeRoomItem({ code: 'BOX', position: { x: 120, y: -5 } }),
    )
    state = roomEditorReducer(
      state,
      nudgeRoomItem({ code: 'BOX', delta: { x: -4, y: 6 } }),
    )

    expect(state.placements.BOX).toEqual({ x: 90, y: 18 })
    expect(state.selectedItemCode).toBe('BOX')
  })

  it('resets the edited layout to backend position keys', () => {
    let state = roomEditorReducer(
      undefined,
      syncRoomLayout({ items, ownerId: 'user-1' }),
    )
    state = roomEditorReducer(
      state,
      placeRoomItem({ code: 'BOX', position: { x: 50, y: 50 } }),
    )
    state = roomEditorReducer(state, resetRoomLayout(items))

    expect(state.placements.BOX).toEqual({ x: 72, y: 80 })
    expect(state.selectedItemCode).toBeNull()
  })

  it('starts a clean layout for another user', () => {
    let state = roomEditorReducer(
      undefined,
      syncRoomLayout({ items, ownerId: 'user-1' }),
    )
    state = roomEditorReducer(
      state,
      placeRoomItem({ code: 'BOX', position: { x: 50, y: 50 } }),
    )
    state = roomEditorReducer(
      state,
      syncRoomLayout({ items, ownerId: 'user-2' }),
    )

    expect(state.ownerId).toBe('user-2')
    expect(state.placements.BOX).toEqual({ x: 72, y: 80 })
  })

  it('clears room UI state on logout', () => {
    let state = roomEditorReducer(
      undefined,
      syncRoomLayout({ items, ownerId: 'user-1' }),
    )
    state = roomEditorReducer(
      state,
      placeRoomItem({ code: 'BOX', position: { x: 50, y: 50 } }),
    )
    state = roomEditorReducer(state, clearUser())

    expect(state).toEqual({
      availableItemCodes: [],
      draggingItemCode: null,
      locallyPlacedItemCodes: [],
      ownerId: null,
      placements: {},
      selectedItemCode: null,
    })
  })

  it('places an unlocked item only after a local drop', () => {
    const unlockedItems: RoomItem[] = [
      items[0]!,
      { ...items[1]!, status: 'UNLOCKED' },
    ]
    let state = roomEditorReducer(
      undefined,
      syncRoomLayout({ items: unlockedItems, ownerId: 'user-1' }),
    )

    expect(state.placements.DESK).toBeUndefined()

    state = roomEditorReducer(
      state,
      placeRoomItem({ code: 'DESK', position: { x: 45, y: 40 } }),
    )

    expect(state.placements.DESK).toEqual({ x: 45, y: 40 })
    expect(state.locallyPlacedItemCodes).toContain('DESK')
    expect(state.selectedItemCode).toBeNull()
  })

  it('toggles selection for an available item', () => {
    let state = roomEditorReducer(
      undefined,
      syncRoomLayout({ items, ownerId: 'user-1' }),
    )

    state = roomEditorReducer(state, selectRoomItem('BOX'))
    expect(state.selectedItemCode).toBe('BOX')

    state = roomEditorReducer(state, selectRoomItem('BOX'))
    expect(state.selectedItemCode).toBeNull()
  })
})
