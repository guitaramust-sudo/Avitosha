import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { setUser } from '../../store/authSlice'
import { createAppStore } from '../../store/store'
import PublicOnlyRoute from './PublicOnlyRoute'

describe('PublicOnlyRoute', () => {
  it('redirects an authenticated user away from register', async () => {
    const store = createAppStore()
    store.dispatch(
      setUser({
        accessToken: 'access-token',
        user: { id: 'user-id', email: 'user@example.com' },
      }),
    )

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route Component={PublicOnlyRoute}>
              <Route path="/register" element={<span>Регистрация</span>} />
            </Route>
            <Route path="/" element={<span>Главная</span>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    )

    expect(await screen.findByText('Главная')).toBeInTheDocument()
    expect(screen.queryByText('Регистрация')).not.toBeInTheDocument()
  })

  it('waits until auth initialization is complete', () => {
    const store = createAppStore()

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route Component={PublicOnlyRoute}>
              <Route path="/register" element={<span>Регистрация</span>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Проверяем авторизацию…',
    )
    expect(screen.queryByText('Регистрация')).not.toBeInTheDocument()
  })
})
