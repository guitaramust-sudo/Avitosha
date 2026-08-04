import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../api/client'
import { createAppStore } from '../../store/store'
import LoginForm from './LoginForm'

const loginUserMock = vi.hoisted(() => vi.fn())

vi.mock('../../api/auth', () => ({
  loginUser: loginUserMock,
}))

const session = {
  accessToken: 'access-token',
  user: { id: 'user-id', email: 'user@example.com' },
}

const renderForm = () => {
  const store = createAppStore()
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/" element={<h1>Главная страница</h1>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  )

  return { queryClient, store, user: userEvent.setup() }
}

const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Email'), 'user@example.com')
  await user.type(screen.getByLabelText('Пароль'), 'password123')
}

describe('LoginForm', () => {
  beforeEach(() => {
    loginUserMock.mockReset()
  })

  it('stores the session and redirects to home after login', async () => {
    loginUserMock.mockResolvedValue(session)
    const { queryClient, store, user } = renderForm()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByRole('heading', { name: 'Главная страница' }),
    ).toBeInTheDocument()
    expect(loginUserMock.mock.calls[0]?.[0]).toEqual({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(store.getState().auth).toMatchObject({
      accessToken: 'access-token',
      isAuthenticated: true,
      user: session.user,
    })
    expect(queryClient.getQueryData(['auth', 'current-user'])).toEqual(session)
  })

  it('shows invalid credentials returned by the backend', async () => {
    loginUserMock.mockRejectedValue(
      new ApiError(401, 'invalid_credentials', 'Invalid email or password'),
    )
    const { user } = renderForm()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('Неверный email или пароль.'),
    ).toBeInTheDocument()
  })

  it('validates the form before sending a request', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Введите email.')).toBeInTheDocument()
    expect(await screen.findByText('Введите пароль.')).toBeInTheDocument()
    expect(loginUserMock).not.toHaveBeenCalled()
  })
})
