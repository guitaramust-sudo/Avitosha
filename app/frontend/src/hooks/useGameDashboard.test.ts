import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import type { GameEvent } from '../types/game'
import {
  gameQueryKeys,
  invalidateGameQueriesForEvents,
} from './useGameDashboard'

describe('invalidateGameQueriesForEvents', () => {
  it('refreshes wallet and retention data for the new realtime events', async () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined)
    const events: GameEvent[] = [
      {
        amount: 5,
        balance: 20,
        earnedTotal: 25,
        id: 'reward-event',
        occurredAt: '2026-08-05T10:00:00Z',
        rewardType: 'AVITO_BONUS',
        sourceKind: 'DAILY_QUEST',
        sourceRef: 'daily-quest-id',
        type: 'AVITO_REWARD_EARNED',
      },
      {
        code: 'DAILY_VIEW',
        id: 'quest-event',
        occurredAt: '2026-08-05T10:00:00Z',
        progress: 1,
        role: 'BUYER',
        status: 'ACTIVE',
        target: 3,
        type: 'DAILY_QUEST_UPDATED',
      },
    ]

    await invalidateGameQueriesForEvents(queryClient, 'user-id', events)

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: gameQueryKeys.daily('user-id'),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: gameQueryKeys.wallet('user-id'),
    })
  })

  it('refreshes task advice when task progress changes', async () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined)

    await invalidateGameQueriesForEvents(queryClient, 'user-id', [
      {
        id: 'progress-event',
        occurredAt: '2026-08-05T10:00:00Z',
        progress: 2,
        target: 5,
        taskCode: 'VIEW_FURNITURE_ADS',
        taskId: 'task-id',
        type: 'TASK_PROGRESS_UPDATED',
      },
    ])

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: gameQueryKeys.advice('user-id'),
    })
  })
})
