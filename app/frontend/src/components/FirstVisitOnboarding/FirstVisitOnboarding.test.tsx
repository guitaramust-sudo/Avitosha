import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setUser } from '../../store/authSlice'
import {
  beginOnboarding,
  beginOnboardingTour,
} from '../../store/onboardingSlice'
import { createAppStore } from '../../store/store'
import { markOnboardingPending } from '../../utils/onboardingStorage'
import FirstVisitOnboarding from './FirstVisitOnboarding'

const userId = '8f0ed065-aefa-4f56-87d0-e2ef2ef43f0d'

describe('FirstVisitOnboarding', () => {
  beforeEach(() => {
    localStorage.clear()
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('moves through highlighted blocks on screen clicks and can be skipped', async () => {
    const store = createAppStore()
    const user = userEvent.setup()
    store.dispatch(
      setUser({
        accessToken: 'access-token',
        user: { email: 'user@example.com', id: userId },
      }),
    )
    store.dispatch(beginOnboarding(userId))
    store.dispatch(beginOnboardingTour())
    markOnboardingPending(userId)

    render(
      <Provider store={store}>
        {[
          'tasks',
          'room',
          'collection',
          'character',
          'leaderboard',
          'wallet',
          'retention',
        ].map((target) => (
          <div data-tour={target} key={target} />
        ))}
        <FirstVisitOnboarding />
      </Provider>,
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Задания и достижения',
      }),
    ).toBeVisible()

    await user.click(screen.getByRole('dialog'))
    expect(
      await screen.findByRole('heading', { name: 'Комната Авитоши' }),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Пропустить' }))
    expect(store.getState().onboarding.stage).toBe('idle')
    expect(
      localStorage.getItem(`avitosha:first-visit-onboarding:${userId}`),
    ).toBeNull()
  })
})
