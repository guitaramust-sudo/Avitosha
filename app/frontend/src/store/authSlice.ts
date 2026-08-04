import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { AuthSession, User } from '../types/auth'

interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  isAuthInitialized: boolean
  user: User | null
}

const initialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  isAuthInitialized: false,
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearUser: (state) => {
      state.accessToken = null
      state.isAuthenticated = false
      state.isAuthInitialized = true
      state.user = null
    },
    setAuthInitialized: (state, action: PayloadAction<boolean>) => {
      state.isAuthInitialized = action.payload
    },
    setUser: (state, action: PayloadAction<AuthSession>) => {
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      state.isAuthInitialized = true
      state.user = action.payload.user
    },
  },
})

export const { clearUser, setAuthInitialized, setUser } = authSlice.actions
export default authSlice.reducer
