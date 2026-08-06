import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getAchievements,
  getDailySummary,
  getPet,
  getRewardWallet,
  getRoom,
  getTask,
  getTaskAdvice,
  getTasks,
  postAction,
  renamePet,
} from './game'

const jsonResponse = (body: unknown) =>
  ({
    headers: { get: () => 'application/json' },
    json: vi.fn().mockResolvedValue(body),
    ok: true,
    status: 200,
  }) as unknown as Response

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('game API', () => {
  it('loads pet and tasks with the access token', async () => {
    const pet = {
      id: 'pet-id',
      name: 'Авитоша',
      level: 1,
      growthXp: 0,
      mood: 'CALM',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(pet))
      .mockResolvedValueOnce(
        jsonResponse({
          tasks: [
            {
              id: 'task-id',
              code: 'VIEW_FURNITURE_ADS',
              roomItemCode: 'DESK',
            },
          ],
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPet('access-token')).resolves.toMatchObject(pet)
    await expect(getTasks('access-token')).resolves.toEqual([
      {
        code: 'VIEW_FURNITURE_ADS',
        id: 'task-id',
        roomItemCode: 'DESK',
      },
    ])

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/pet')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/tasks')
    for (const call of fetchMock.mock.calls) {
      expect(call[1]).toMatchObject({
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      })
    }
  })

  it('posts the mock Avito action without changing its DTO', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ actionId: 'action-id', duplicate: false, events: [] }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const action = {
      eventId: 'event-id',
      type: 'AD_VIEWED' as const,
      entityId: 'advert-1',
      category: 'FURNITURE',
      occurredAt: '2026-08-05T12:00:00Z',
      metadata: { source: 'test' },
    }

    await expect(postAction('access-token', action)).resolves.toMatchObject({
      actionId: 'action-id',
      duplicate: false,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/actions',
      expect.objectContaining({
        body: JSON.stringify(action),
        credentials: 'include',
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      }),
    )
  })

  it('renames the pet through the documented PATCH endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 'pet-id',
        name: 'Мурзик',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(renamePet('access-token', 'мурзик')).resolves.toMatchObject({
      name: 'Мурзик',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/pet',
      expect.objectContaining({
        body: JSON.stringify({ name: 'мурзик' }),
        credentials: 'include',
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      }),
    )
  })

  it('loads the reward wallet and normalizes an empty catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          balance: {
            balance: 20,
            earnedTotal: 25,
            type: 'AVITO_BONUS',
            updatedAt: '2026-08-05T10:00:00Z',
          },
          catalog: null,
          nextGoal: {
            code: 'FREE_DELIVERY',
            current: 25,
            perkType: 'FREE_DELIVERY',
            remaining: 5,
            rewardType: 'AVITO_BONUS',
            target: 30,
            title: 'Бесплатная доставка',
          },
        }),
      ),
    )

    await expect(getRewardWallet('access-token')).resolves.toMatchObject({
      balance: { balance: 20, earnedTotal: 25 },
      catalog: [],
      nextGoal: { remaining: 5 },
    })
  })

  it('normalizes null unlocked room items in the daily summary', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          date: '2026-08-05',
          actionsCount: 0,
          completedTasks: 0,
          earnedXp: 0,
          levelBefore: 1,
          levelAfter: 1,
          unlockedRoomItems: null,
          storyStageBefore: 0,
          storyStageAfter: 0,
          weeklyScoreDelta: 0,
          weeklyPosition: null,
          petMood: 'CALM',
        }),
      ),
    )

    await expect(getDailySummary('access-token')).resolves.toMatchObject({
      unlockedRoomItems: [],
    })
  })

  it('keeps only room items documented by the backend contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          storyCode: 'FIRST_ROOM',
          progress: '1/6',
          items: [
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
              code: 'RUG',
              name: 'Ковёр',
              description: 'Не входит в текущий контракт',
              status: 'LOCKED',
              assetKey: 'room.rug',
              positionKey: 'rug',
              unlockTaskCode: null,
            },
          ],
        }),
      ),
    )

    const room = await getRoom('access-token')

    expect(room.items.map((item) => item.code)).toEqual(['BOX'])
  })

  it('loads an individual task by its encoded id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 'task/id',
        code: 'VIEW_FURNITURE_ADS',
        roomItemCode: 'DESK',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getTask('access-token', 'task/id')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/tasks/task%2Fid')
  })

  it('loads advice for an individual task', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        generatedByAi: false,
        taskId: 'task/id',
        text: 'Сравни несколько вариантов.',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getTaskAdvice('access-token', 'task/id'),
    ).resolves.toMatchObject({
      generatedByAi: false,
      text: 'Сравни несколько вариантов.',
    })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/tasks/task%2Fid/advice')
  })

  it('filters achievements outside the documented scenario', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          achievements: [
            {
              code: 'FIRST_STEP',
              title: 'Первый шаг',
              description: 'Выполнить первое задание',
              iconKey: 'achievement.first_step',
              unlocked: false,
              unlockedAt: null,
            },
            {
              code: 'COIN_COLLECTOR',
              title: 'Монеты',
              description: 'Не относится к продуктовой модели',
              iconKey: 'achievement.coins',
              unlocked: false,
              unlockedAt: null,
            },
          ],
        }),
      ),
    )

    const achievements = await getAchievements('access-token')

    expect(achievements.map((achievement) => achievement.code)).toEqual([
      'FIRST_STEP',
    ])
  })
})
