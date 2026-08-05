import {
  configureStore,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit'

import authReducer from './authSlice'
import gameReducer from './gameSlice'
import roomEditorReducer from './roomEditorSlice'
import toastReducer from './toastSlice'

export const createAppStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      game: gameReducer,
      roomEditor: roomEditorReducer,
      toast: toastReducer,
    },
  })

export const store = createAppStore()

export type AppStore = ReturnType<typeof createAppStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  UnknownAction
>
