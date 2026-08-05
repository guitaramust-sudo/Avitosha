import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { RoomItem, RoomItemCode } from '../types/game'
import {
  clampRoomPosition,
  getDefaultRoomPosition,
  type RoomPosition,
} from '../utils/roomLayout'
import { clearUser } from './authSlice'

interface RoomEditorState {
  availableItemCodes: RoomItemCode[]
  draggingItemCode: RoomItemCode | null
  locallyPlacedItemCodes: RoomItemCode[]
  ownerId: string | null
  placements: Partial<Record<RoomItemCode, RoomPosition>>
  selectedItemCode: RoomItemCode | null
}

const initialState: RoomEditorState = {
  availableItemCodes: [],
  draggingItemCode: null,
  locallyPlacedItemCodes: [],
  ownerId: null,
  placements: {},
  selectedItemCode: null,
}

interface RoomItemsPayload {
  items: RoomItem[]
  ownerId: string
}

const isAvailable = (item: RoomItem) => item.status !== 'LOCKED'
const isPlaced = (item: RoomItem) => item.status === 'PLACED'

const roomEditorSlice = createSlice({
  name: 'roomEditor',
  initialState,
  reducers: {
    beginRoomItemDrag: (state, action: PayloadAction<RoomItemCode>) => {
      if (!state.availableItemCodes.includes(action.payload)) {
        return
      }

      state.draggingItemCode = action.payload
      state.selectedItemCode = action.payload
    },
    endRoomItemDrag: (state) => {
      state.draggingItemCode = null
    },
    nudgeRoomItem: (
      state,
      action: PayloadAction<{ code: RoomItemCode; delta: RoomPosition }>,
    ) => {
      const currentPosition = state.placements[action.payload.code]

      if (!currentPosition) {
        return
      }

      state.placements[action.payload.code] = clampRoomPosition({
        x: currentPosition.x + action.payload.delta.x,
        y: currentPosition.y + action.payload.delta.y,
      })
      state.selectedItemCode = action.payload.code
    },
    placeRoomItem: (
      state,
      action: PayloadAction<{ code: RoomItemCode; position: RoomPosition }>,
    ) => {
      if (!state.availableItemCodes.includes(action.payload.code)) {
        return
      }

      state.placements[action.payload.code] = clampRoomPosition(
        action.payload.position,
      )
      if (!state.locallyPlacedItemCodes.includes(action.payload.code)) {
        state.locallyPlacedItemCodes.push(action.payload.code)
      }
      state.draggingItemCode = null
      state.selectedItemCode = null
    },
    resetRoomLayout: (state, action: PayloadAction<RoomItem[]>) => {
      const locallyPlacedCodes = new Set(state.locallyPlacedItemCodes)
      state.placements = Object.fromEntries(
        action.payload.flatMap((item, index) =>
          isPlaced(item) || locallyPlacedCodes.has(item.code)
            ? [[item.code, getDefaultRoomPosition(item.positionKey, index)]]
            : [],
        ),
      )
      state.draggingItemCode = null
      state.selectedItemCode = null
    },
    selectRoomItem: (state, action: PayloadAction<RoomItemCode | null>) => {
      if (
        action.payload !== null &&
        !state.availableItemCodes.includes(action.payload)
      ) {
        return
      }

      state.selectedItemCode =
        state.selectedItemCode === action.payload ? null : action.payload
    },
    syncRoomLayout: (state, action: PayloadAction<RoomItemsPayload>) => {
      const { items, ownerId } = action.payload

      if (state.ownerId !== ownerId) {
        state.ownerId = ownerId
        state.availableItemCodes = []
        state.placements = {}
        state.draggingItemCode = null
        state.locallyPlacedItemCodes = []
        state.selectedItemCode = null
      }

      const itemCodes = new Set(items.map((item) => item.code))
      const availableCodes = new Set(
        items.filter(isAvailable).map((item) => item.code),
      )
      const serverPlacedCodes = new Set(
        items.filter(isPlaced).map((item) => item.code),
      )

      state.availableItemCodes = [...availableCodes]
      state.locallyPlacedItemCodes = state.locallyPlacedItemCodes.filter(
        (code) =>
          itemCodes.has(code) &&
          availableCodes.has(code) &&
          !serverPlacedCodes.has(code),
      )
      const visibleCodes = new Set([
        ...serverPlacedCodes,
        ...state.locallyPlacedItemCodes,
      ])

      for (const code of Object.keys(state.placements)) {
        if (!visibleCodes.has(code as RoomItemCode)) {
          delete state.placements[code as RoomItemCode]
        }
      }

      items.forEach((item, index) => {
        if (visibleCodes.has(item.code)) {
          state.placements[item.code] ??= getDefaultRoomPosition(
            item.positionKey,
            index,
          )
        }
      })

      if (
        state.selectedItemCode &&
        !availableCodes.has(state.selectedItemCode)
      ) {
        state.selectedItemCode = null
      }
      if (
        state.draggingItemCode &&
        !availableCodes.has(state.draggingItemCode)
      ) {
        state.draggingItemCode = null
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearUser, () => initialState)
  },
})

export const {
  beginRoomItemDrag,
  endRoomItemDrag,
  nudgeRoomItem,
  placeRoomItem,
  resetRoomLayout,
  selectRoomItem,
  syncRoomLayout,
} = roomEditorSlice.actions
export default roomEditorSlice.reducer
