import { afterEach, describe, expect, it, vi } from 'vitest'

import { getPet, getTasks, postAction } from './game'

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
      .mockResolvedValueOnce(jsonResponse({ tasks: [{ id: 'task-id' }] }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPet('access-token')).resolves.toMatchObject(pet)
    await expect(getTasks('access-token')).resolves.toEqual([{ id: 'task-id' }])

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
})
