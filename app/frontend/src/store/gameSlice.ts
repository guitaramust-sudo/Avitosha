import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'

import type {
  Achievement,
  DailySummary,
  GameEvent,
  GameTask,
  LeaderboardResponse,
  PetProfile,
  RewardWallet,
  RoomResponse,
  StoryResponse,
} from '../types/game'
import { clearUser } from './authSlice'
import type { AppThunk, RootState } from './store'

const PROCESSED_EVENT_IDS_LIMIT = 200

export interface GameDashboardSnapshot {
  achievements: Achievement[]
  daily: DailySummary
  leaderboard: LeaderboardResponse
  pet: PetProfile
  room: RoomResponse
  story: StoryResponse
  tasks: GameTask[]
  wallet: RewardWallet
}

export interface GameState {
  achievements: Achievement[]
  daily: DailySummary | null
  leaderboard: LeaderboardResponse | null
  ownerId: string | null
  pet: PetProfile | null
  processedEventIds: string[]
  room: RoomResponse | null
  story: StoryResponse | null
  tasks: GameTask[]
  wallet: RewardWallet | null
}

interface SyncGameDashboardPayload extends GameDashboardSnapshot {
  ownerId: string
}

const createInitialState = (): GameState => ({
  achievements: [],
  daily: null,
  leaderboard: null,
  ownerId: null,
  pet: null,
  processedEventIds: [],
  room: null,
  story: null,
  tasks: [],
  wallet: null,
})

const gameSlice = createSlice({
  name: 'game',
  initialState: createInitialState(),
  reducers: {
    recordGameEventIds: (state, action: PayloadAction<string[]>) => {
      const knownIds = new Set(state.processedEventIds)

      for (const id of action.payload) {
        if (!knownIds.has(id)) {
          knownIds.add(id)
          state.processedEventIds.push(id)
        }
      }

      if (state.processedEventIds.length > PROCESSED_EVENT_IDS_LIMIT) {
        state.processedEventIds = state.processedEventIds.slice(
          -PROCESSED_EVENT_IDS_LIMIT,
        )
      }
    },
    syncGameDashboard: (
      state,
      action: PayloadAction<SyncGameDashboardPayload>,
    ) => {
      const { ownerId, ...snapshot } = action.payload

      return {
        ...snapshot,
        ownerId,
        processedEventIds:
          state.ownerId === ownerId ? state.processedEventIds : [],
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearUser, createInitialState)
  },
})

export const { recordGameEventIds, syncGameDashboard } = gameSlice.actions

export const selectGameState = (state: RootState) => state.game
export const selectGamePet = (state: RootState) => state.game.pet
export const selectGameTasks = (state: RootState) => state.game.tasks
export const selectGameRoom = (state: RootState) => state.game.room
export const selectGameStory = (state: RootState) => state.game.story
export const selectGameDaily = (state: RootState) => state.game.daily
export const selectGameLeaderboard = (state: RootState) =>
  state.game.leaderboard
export const selectGameAchievements = (state: RootState) =>
  state.game.achievements
export const selectGameWallet = (state: RootState) => state.game.wallet

export const selectIsGameReady = createSelector(
  [selectGameState],
  ({ daily, leaderboard, ownerId, pet, room, story, wallet }) =>
    Boolean(ownerId && pet && room && story && daily && leaderboard && wallet),
)

export const selectGameDashboard = createSelector(
  [selectGameState, selectIsGameReady],
  (game, isReady): GameDashboardSnapshot | null =>
    isReady &&
    game.pet &&
    game.room &&
    game.story &&
    game.daily &&
    game.leaderboard &&
    game.wallet
      ? {
          achievements: game.achievements,
          daily: game.daily,
          leaderboard: game.leaderboard,
          pet: game.pet,
          room: game.room,
          story: game.story,
          tasks: game.tasks,
          wallet: game.wallet,
        }
      : null,
)

export const acceptGameEvents =
  (events: readonly GameEvent[]): AppThunk<GameEvent[]> =>
  (dispatch, getState) => {
    const knownIds = new Set(getState().game.processedEventIds)
    const acceptedEvents: GameEvent[] = []

    for (const event of events) {
      if (!knownIds.has(event.id)) {
        knownIds.add(event.id)
        acceptedEvents.push(event)
      }
    }

    if (acceptedEvents.length > 0) {
      dispatch(recordGameEventIds(acceptedEvents.map((event) => event.id)))
    }

    return acceptedEvents
  }

export default gameSlice.reducer
