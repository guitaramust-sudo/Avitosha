import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setUser } from '../../store/authSlice'
import { createAppStore } from '../../store/store'
import TaskDetailsDialog from './TaskDetailsDialog'

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

describe('TaskDetailsDialog', () => {
  it('loads task details and closes from its button', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        actionType: 'AD_VIEWED',
        avitoRewardAmount: 10,
        avitoRewardType: 'AVITO_BONUS',
        category: 'FURNITURE',
        code: 'VIEW_FURNITURE_ADS',
        description: 'Посмотри 5 объявлений с мебелью',
        id: 'task-id',
        petPhrase: 'Давай найдём стол!',
        progress: 2,
        roomItemCode: 'DESK',
        status: 'ACTIVE',
        storyStage: 1,
        target: 5,
        title: 'Помоги выбрать стол',
        xpReward: 30,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const store = createAppStore()
    store.dispatch(
      setUser({
        accessToken: 'access-token',
        user: { email: 'user@example.com', id: 'user-id' },
      }),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <TaskDetailsDialog taskId="task-id" onClose={onClose} />
        </QueryClientProvider>
      </Provider>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Помоги выбрать стол' }),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/tasks/task-id')

    await user.click(
      screen.getByRole('button', { name: 'Закрыть детали задания' }),
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
})
