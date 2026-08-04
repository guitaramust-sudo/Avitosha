import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { clearUser, setUser } from '../../store/authSlice'
import { createAppStore } from '../../store/store'
import ProtectedRoute from './ProtectedRoute'

const renderRoutes = (authenticated: boolean) => {
  const store = createAppStore()

  store.dispatch(
    authenticated
      ? setUser({
          accessToken: 'access-token',
          user: { id: 'user-id', email: 'user@example.com' },
        })
      : clearUser(),
  )

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route Component={ProtectedRoute}>
            <Route path="/" element={<span>Главная</span>} />
          </Route>
          <Route path="/register" element={<span>Регистрация</span>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('renders the home page for an authenticated user', () => {
    renderRoutes(true)

    expect(screen.getByText('Главная')).toBeInTheDocument()
  })

  it('redirects an unauthenticated user to register', async () => {
    renderRoutes(false)

    expect(await screen.findByText('Регистрация')).toBeInTheDocument()
    expect(screen.queryByText('Главная')).not.toBeInTheDocument()
  })
})
