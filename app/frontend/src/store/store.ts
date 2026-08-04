import { configureStore } from '@reduxjs/toolkit'

import authReducer from './authSlice'
import toastReducer from './toastSlice'

export const createAppStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      toast: toastReducer,
    },
  })

export const store = createAppStore()

export type AppStore = ReturnType<typeof createAppStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
