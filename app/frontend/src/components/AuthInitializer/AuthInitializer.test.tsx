import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../api/client'
import { setUser } from '../../store/authSlice'
import { createAppStore } from '../../store/store'
import AuthInitializer from './AuthInitializer'

const restoreSessionMock = vi.hoisted(() => vi.fn())

vi.mock('../../api/auth', () => ({
  restoreSession: restoreSessionMock,
}))

const renderInitializer = (authenticated = false) => {
  const store = createAppStore()

  if (authenticated) {
    store.dispatch(
      setUser({
        accessToken: 'existing-token',
        user: { id: 'user-id', email: 'user@example.com' },
      }),
    )
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          <span>Приложение</span>
        </AuthInitializer>
      </QueryClientProvider>
    </Provider>,
  )

  return store
}

describe('AuthInitializer', () => {
  beforeEach(() => {
    restoreSessionMock.mockReset()
  })

  it('restores authentication after a page reload', async () => {
    const session = {
      accessToken: 'restored-token',
      user: { id: 'user-id', email: 'user@example.com' },
    }
    restoreSessionMock.mockResolvedValue(session)
    const store = renderInitializer()

    expect(screen.getByText('Приложение')).toBeInTheDocument()
    await waitFor(() => {
      expect(store.getState().auth).toEqual({
        accessToken: 'restored-token',
        isAuthenticated: true,
        isAuthInitialized: true,
        user: session.user,
      })
    })
  })

  it('finishes initialization when refresh authentication is missing', async () => {
    restoreSessionMock.mockRejectedValue(
      new ApiError(401, 'unauthorized', 'Authentication is required'),
    )
    const store = renderInitializer()

    await waitFor(() => {
      expect(store.getState().auth).toEqual({
        accessToken: null,
        isAuthenticated: false,
        isAuthInitialized: true,
        user: null,
      })
    })
  })

  it('keeps an existing session during a temporary network error', async () => {
    restoreSessionMock.mockRejectedValue(
      new ApiError(0, 'network_error', 'Network unavailable'),
    )
    const store = renderInitializer(true)

    await waitFor(() => {
      expect(restoreSessionMock).toHaveBeenCalledOnce()
    })
    expect(store.getState().auth).toEqual({
      accessToken: 'existing-token',
      isAuthenticated: true,
      isAuthInitialized: true,
      user: { id: 'user-id', email: 'user@example.com' },
    })
  })
})
