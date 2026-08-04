import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ToastTone = 'error' | 'success'

interface ToastState {
  id: number
  message: string | null
  tone: ToastTone
}

const initialState: ToastState = {
  id: 0,
  message: null,
  tone: 'success',
}

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    dismissToast: (state, action: PayloadAction<number | undefined>) => {
      if (action.payload === undefined || action.payload === state.id) {
        state.message = null
      }
    },
    showToast: (
      state,
      action: PayloadAction<{ message: string; tone?: ToastTone }>,
    ) => {
      state.id += 1
      state.message = action.payload.message
      state.tone = action.payload.tone ?? 'success'
    },
  },
})

export const { dismissToast, showToast } = toastSlice.actions
export default toastSlice.reducer
