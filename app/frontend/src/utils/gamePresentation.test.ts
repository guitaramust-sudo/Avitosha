import { describe, expect, it } from 'vitest'

import type { GameEvent } from '../types/game'
import { getGameEventMessage, hasNotifiableGameEvent } from './gamePresentation'

describe('getGameEventMessage', () => {
  it('combines a completed task title and its rewards into one playful message', () => {
    const occurredAt = '2026-08-13T12:00:00Z'
    const events: GameEvent[] = [
      {
        id: 'task-event',
        occurredAt,
        type: 'TASK_COMPLETED',
        taskId: 'task-id',
        taskCode: 'CREATE_FIRST_AD',
        taskTitle: 'Первое объявление',
        xpReward: 50,
        avitoRewardAmount: 20,
      },
      {
        id: 'xp-event',
        occurredAt,
        type: 'XP_EARNED',
        amount: 50,
        totalXp: 50,
      },
    ]

    expect(getGameEventMessage(events)).toBe(
      'Ты выполнил задание «Первое объявление»! Ура! Теперь ты получил 50 XP и 20 Avito-бонусов',
    )
  })

  it('does not notify about an ordinary listing view', () => {
    const events: GameEvent[] = [
      {
        id: 'view-event',
        occurredAt: '2026-08-13T12:00:00Z',
        type: 'LISTING_VIEWED',
      },
    ]

    expect(hasNotifiableGameEvent(events)).toBe(false)
    expect(getGameEventMessage(events)).not.toContain(
      'Просмотр объявления учтён',
    )
  })
})
