import { describe, expect, it } from 'vitest'

import authReducer, { clearUser, setUser } from './authSlice'

const session = {
  accessToken: 'access-token',
  user: {
    id: '8f0ed065-aefa-4f56-87d0-e2ef2ef43f0d',
    email: 'user@example.com',
  },
}

describe('authSlice', () => {
  it('stores an authenticated session', () => {
    const state = authReducer(undefined, setUser(session))

    expect(state).toEqual({
      accessToken: 'access-token',
      isAuthenticated: true,
      isAuthInitialized: true,
      user: session.user,
    })
  })

  it('clears the session and completes initialization', () => {
    const authenticatedState = authReducer(undefined, setUser(session))
    const state = authReducer(authenticatedState, clearUser())

    expect(state).toEqual({
      accessToken: null,
      isAuthenticated: false,
      isAuthInitialized: true,
      user: null,
    })
  })
})
