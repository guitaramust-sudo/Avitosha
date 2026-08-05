import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../api/client'
import { setUser } from '../../store/authSlice'
import { createAppStore } from '../../store/store'
import ToastViewport from '../ToastViewport/ToastViewport'
import HomeHeader from './HomeHeader'

const logoutUserMock = vi.hoisted(() => vi.fn())

vi.mock('../../api/auth', () => ({
  logoutUser: logoutUserMock,
}))

const renderHeader = () => {
  const store = createAppStore()
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  store.dispatch(
    setUser({
      accessToken: 'access-token',
      user: { id: 'user-id', email: 'user@example.com' },
    }),
  )

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<HomeHeader />} />
            <Route path="/register" element={<h1>Регистрация</h1>} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </QueryClientProvider>
    </Provider>,
  )

  return { queryClient, store, user: userEvent.setup() }
}

describe('HomeHeader', () => {
  beforeEach(() => {
    logoutUserMock.mockReset()
  })

  it('shows the first email letter for the authenticated user', () => {
    renderHeader()

    expect(
      screen.getByRole('button', {
        name: 'Открыть профиль user@example.com',
      }),
    ).toHaveTextContent('U')
  })

  it('does not render controls unsupported by the backend', () => {
    renderHeader()

    expect(screen.queryByText('1 450')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Уведомления' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Открыть меню' }),
    ).not.toBeInTheDocument()
  })

  it('clears the session and redirects to registration after logout', async () => {
    logoutUserMock.mockResolvedValue(undefined)
    const { queryClient, store, user } = renderHeader()
    queryClient.setQueryData(['auth', 'current-user'], {
      accessToken: 'access-token',
      user: { id: 'user-id', email: 'user@example.com' },
    })

    await user.click(
      screen.getByRole('button', {
        name: 'Открыть профиль user@example.com',
      }),
    )

    expect(logoutUserMock).not.toHaveBeenCalled()
    await user.click(
      screen.getByRole('menuitem', { name: 'Выйти из аккаунта' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Регистрация' }),
    ).toBeInTheDocument()
    expect(logoutUserMock).toHaveBeenCalledOnce()
    expect(store.getState().auth).toEqual({
      accessToken: null,
      isAuthenticated: false,
      isAuthInitialized: true,
      user: null,
    })
    expect(queryClient.getQueryData(['auth', 'current-user'])).toBeUndefined()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Вы вышли из аккаунта.',
    )
  })

  it('keeps the local session when logout fails on the server', async () => {
    logoutUserMock.mockRejectedValue(
      new ApiError(500, 'internal_error', 'Internal server error'),
    )
    const { store, user } = renderHeader()

    await user.click(
      screen.getByRole('button', {
        name: 'Открыть профиль user@example.com',
      }),
    )
    await user.click(
      screen.getByRole('menuitem', { name: 'Выйти из аккаунта' }),
    )

    expect(
      await screen.findByText('Не удалось выйти. Попробуйте ещё раз.'),
    ).toBeInTheDocument()
    expect(store.getState().auth.isAuthenticated).toBe(true)
  })
})
