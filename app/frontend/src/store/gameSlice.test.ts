import { describe, expect, it } from 'vitest'

import type { GameEvent } from '../types/game'
import { clearUser } from './authSlice'
import gameReducer, {
  acceptGameEvents,
  type GameDashboardSnapshot,
  recordGameEventIds,
  selectGameDashboard,
  selectIsGameReady,
  syncGameDashboard,
} from './gameSlice'
import { createAppStore } from './store'

const createSnapshot = (suffix = 'one'): GameDashboardSnapshot => ({
  achievements: [
    {
      code: 'FIRST_STEP',
      description: 'Первое достижение',
      iconKey: 'achievement.first',
      title: `Достижение ${suffix}`,
      unlocked: true,
      unlockedAt: '2026-08-05T10:00:00Z',
    },
  ],
  daily: {
    actionsCount: 1,
    completedTasks: 1,
    date: '2026-08-05',
    earnedXp: 30,
    levelAfter: 1,
    levelBefore: 1,
    petMood: 'HAPPY',
    storyStageAfter: 1,
    storyStageBefore: 0,
    unlockedRoomItems: ['BOX'],
    weeklyPosition: 1,
    weeklyScoreDelta: 100,
    retention: {
      streak: {
        activeToday: true,
        current: 3,
        lastActiveDate: '2026-08-05',
        longest: 4,
        reward: { amount: 4, source: 'STREAK', type: 'AVITO_BONUS' },
      },
      dailyQuest: {
        actionType: 'AD_VIEWED',
        category: null,
        code: 'DAILY_VIEW',
        date: '2026-08-05',
        description: 'Посмотреть объявление',
        progress: 1,
        reward: { amount: 5, source: 'DAILY_QUEST', type: 'AVITO_BONUS' },
        status: 'ACTIVE',
        target: 3,
        title: 'Найти интересное',
      },
      tomorrow: {
        dailyQuest: {
          actionType: 'AD_FAVORITED',
          category: null,
          code: 'DAILY_FAVORITE',
          description: 'Добавить объявление в избранное',
          reward: { amount: 5, source: 'DAILY_QUEST', type: 'AVITO_BONUS' },
          target: 1,
          title: 'Сохранить находку',
        },
        date: '2026-08-06',
        nextGoal: null,
        streakAfterReturn: 4,
        streakReward: { amount: 2, source: 'STREAK', type: 'AVITO_BONUS' },
      },
    },
  },
  leaderboard: {
    currentUser: {
      completedTasks: 1,
      level: 1,
      petName: `Авитоша ${suffix}`,
      position: 1,
      score: 100,
      userId: `user-${suffix}`,
    },
    leaders: [],
    weekStart: '2026-08-03',
  },
  pet: {
    character: null,
    characterProfile: {
      code: 'EXPLORER',
      description: 'Любит исследовать',
      iconKey: 'character.explorer',
      name: 'Исследователь',
      progress: 1,
      target: 5,
      unlocked: false,
      visualDetail: 'magnifier',
    },
    currentStory: {
      code: 'FIRST_ROOM',
      currentStage: 1,
      status: 'ACTIVE',
      title: 'Первая комната',
      totalStages: 5,
    },
    growthXp: 30,
    id: `pet-${suffix}`,
    level: 1,
    mood: 'HAPPY',
    name: `Авитоша ${suffix}`,
    nextLevelXp: 100,
  },
  room: {
    items: [
      {
        assetKey: 'room.box',
        code: 'BOX',
        description: 'Первая коробка',
        name: 'Коробка',
        positionKey: 'box',
        status: 'PLACED',
        unlockTaskCode: null,
      },
    ],
    progress: '1/6',
    storyCode: 'FIRST_ROOM',
  },
  story: {
    code: 'FIRST_ROOM',
    currentStage: 1,
    description: 'Обустроить комнату',
    nextTask: null,
    status: 'ACTIVE',
    title: 'Первая комната',
    totalStages: 5,
  },
  tasks: [],
  wallet: {
    balance: {
      balance: 20,
      earnedTotal: 20,
      type: 'AVITO_BONUS',
      updatedAt: '2026-08-05T10:00:00Z',
    },
    catalog: [],
    nextGoal: null,
  },
})

const createEvent = (id: string): GameEvent => ({
  amount: 10,
  id,
  occurredAt: '2026-08-05T10:00:00Z',
  totalXp: 30,
  type: 'XP_EARNED',
})

describe('gameSlice', () => {
  it('stores a complete dashboard snapshot and exposes ready selectors', () => {
    const store = createAppStore()
    const snapshot = createSnapshot()

    expect(selectIsGameReady(store.getState())).toBe(false)
    expect(selectGameDashboard(store.getState())).toBeNull()

    store.dispatch(syncGameDashboard({ ...snapshot, ownerId: 'user-one' }))

    expect(selectIsGameReady(store.getState())).toBe(true)
    expect(selectGameDashboard(store.getState())).toEqual(snapshot)
  })

  it('preserves processed events for the same owner and resets them for another owner', () => {
    const firstSnapshot = createSnapshot('one')
    let state = gameReducer(
      undefined,
      syncGameDashboard({ ...firstSnapshot, ownerId: 'user-one' }),
    )
    state = gameReducer(state, recordGameEventIds(['event-one']))
    state = gameReducer(
      state,
      syncGameDashboard({ ...createSnapshot('updated'), ownerId: 'user-one' }),
    )

    expect(state.processedEventIds).toEqual(['event-one'])

    state = gameReducer(
      state,
      syncGameDashboard({ ...createSnapshot('two'), ownerId: 'user-two' }),
    )

    expect(state.ownerId).toBe('user-two')
    expect(state.pet?.id).toBe('pet-two')
    expect(state.processedEventIds).toEqual([])
  })

  it('stores unique event IDs and keeps only the latest 200', () => {
    const ids = Array.from({ length: 205 }, (_, index) => `event-${index}`)
    let state = gameReducer(undefined, recordGameEventIds(ids))

    expect(state.processedEventIds).toHaveLength(200)
    expect(state.processedEventIds[0]).toBe('event-5')
    expect(state.processedEventIds.at(-1)).toBe('event-204')

    state = gameReducer(state, recordGameEventIds(['event-204', 'event-205']))

    expect(state.processedEventIds).toHaveLength(200)
    expect(new Set(state.processedEventIds)).toHaveLength(200)
    expect(state.processedEventIds[0]).toBe('event-6')
    expect(state.processedEventIds.at(-1)).toBe('event-205')
  })

  it('accepts each event once and records accepted IDs in one dispatch', () => {
    const store = createAppStore()
    const first = createEvent('event-one')
    const second = createEvent('event-two')

    const acceptedFirst = store.dispatch(
      acceptGameEvents([first, first, second]),
    )
    const acceptedSecond = store.dispatch(
      acceptGameEvents([first, createEvent('event-three')]),
    )

    expect(acceptedFirst.map((event) => event.id)).toEqual([
      'event-one',
      'event-two',
    ])
    expect(acceptedSecond.map((event) => event.id)).toEqual(['event-three'])
    expect(store.getState().game.processedEventIds).toEqual([
      'event-one',
      'event-two',
      'event-three',
    ])
  })

  it('resets the entire game state when authentication is cleared', () => {
    let state = gameReducer(
      undefined,
      syncGameDashboard({ ...createSnapshot(), ownerId: 'user-one' }),
    )
    state = gameReducer(state, recordGameEventIds(['event-one']))
    state = gameReducer(state, clearUser())

    expect(state).toEqual({
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
  })
})
