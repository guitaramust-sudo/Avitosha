import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { clearUser } from './authSlice'
import type { RootState } from './store'

type OnboardingStage = 'idle' | 'naming' | 'tour'

interface OnboardingState {
  ownerId: string | null
  stage: OnboardingStage
}

const initialState: OnboardingState = {
  ownerId: null,
  stage: 'idle',
}

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    beginOnboarding: (state, action: PayloadAction<string>) => {
      state.ownerId = action.payload
      state.stage = 'naming'
    },
    beginOnboardingTour: (state) => {
      if (state.ownerId) state.stage = 'tour'
    },
    finishOnboarding: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(clearUser, () => initialState)
  },
})

export const { beginOnboarding, beginOnboardingTour, finishOnboarding } =
  onboardingSlice.actions
export const selectOnboarding = (state: RootState) => state.onboarding
export default onboardingSlice.reducer
