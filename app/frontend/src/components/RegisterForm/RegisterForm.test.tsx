import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../api/client'
import { createAppStore } from '../../store/store'
import RegisterForm from './RegisterForm'

const registerUserMock = vi.hoisted(() => vi.fn())

vi.mock('../../api/auth', () => ({
  registerUser: registerUserMock,
}))

const session = {
  accessToken: 'access-token',
  user: {
    id: '8f0ed065-aefa-4f56-87d0-e2ef2ef43f0d',
    email: 'user@example.com',
  },
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
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/" element={<h1>Главная страница</h1>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  )

  return { queryClient, store, user: userEvent.setup() }
}

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Email'), 'user@example.com')
  await user.type(screen.getByLabelText('Пароль'), 'password123')
  await user.type(screen.getByLabelText('Повторите пароль'), 'password123')
}

describe('RegisterForm', () => {
  beforeEach(() => {
    registerUserMock.mockReset()
  })

  it('stores the user in Redux and redirects after registration', async () => {
    registerUserMock.mockResolvedValue(session)
    const { queryClient, store, user } = renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('Главная страница')).toBeInTheDocument()
    expect(registerUserMock.mock.calls[0]?.[0]).toEqual({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(store.getState().auth).toMatchObject({
      accessToken: 'access-token',
      isAuthenticated: true,
      isAuthInitialized: true,
      user: session.user,
    })
    expect(queryClient.getQueryData(['auth', 'current-user'])).toEqual(session)
  })

  it('does not submit mismatched passwords', async () => {
    const { user } = renderForm()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.type(screen.getByLabelText('Повторите пароль'), 'different123')
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('Пароли не совпадают.')).toBeInTheDocument()
    expect(registerUserMock).not.toHaveBeenCalled()
  })

  it('shows an email field error returned by backend', async () => {
    registerUserMock.mockRejectedValue(
      new ApiError(409, 'email_already_exists', 'Email already exists'),
    )
    const { user } = renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(
      await screen.findByText('Пользователь с таким email уже существует.'),
    ).toBeInTheDocument()
  })

  it('shows a general server error', async () => {
    registerUserMock.mockRejectedValue(
      new ApiError(500, 'internal_error', 'Internal server error'),
    )
    const { user } = renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(
      await screen.findByText('Сервер временно недоступен. Попробуйте позже.'),
    ).toBeInTheDocument()
  })

  it('prevents a duplicate submit while the request is pending', async () => {
    let resolveRegistration: (value: typeof session) => void = () => undefined
    registerUserMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRegistration = resolve
      }),
    )
    const { user } = renderForm()

    await fillValidForm(user)
    const submitButton = screen.getByRole('button', {
      name: 'Зарегистрироваться',
    })

    await user.dblClick(submitButton)

    expect(registerUserMock).toHaveBeenCalledTimes(1)
    expect(submitButton).toBeDisabled()

    resolveRegistration(session)
    await waitFor(() => {
      expect(screen.getByText('Главная страница')).toBeInTheDocument()
    })
  })
})
