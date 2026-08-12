import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'

import { createAppStore } from '../../store/store'
import RetentionPanel from './RetentionPanel'

describe('RetentionPanel', () => {
  it('shows five quests, the any-two goal and both role groups', () => {
    const store = createAppStore()
    const roles = ['BUYER', 'BUYER', 'SELLER', 'SELLER', 'UNIVERSAL'] as const
    store.dispatch({
      type: 'game/syncGameDashboard',
      payload: {
        ownerId: 'user-id',
        achievements: [],
        leaderboard: null,
        pet: null,
        room: null,
        story: null,
        tasks: [],
        wallet: null,
        daily: {
          retention: {
            streak: {
              activeToday: false,
              current: 3,
              lastActiveDate: null,
              longest: 5,
              protections: 1,
              reward: { amount: 2, source: 'STREAK', type: 'AVITO_BONUS' },
            },
            dailyGoal: {
              date: '2026-08-12',
              completed: 1,
              required: 2,
              status: 'ACTIVE',
              xpReward: 30,
              reward: { amount: 5, source: 'DAILY_GOAL', type: 'AVITO_BONUS' },
              balancedCompleted: false,
              balancedReward: {
                amount: 3,
                source: 'BALANCED_DAY',
                type: 'AVITO_BONUS',
              },
              quests: roles.map((role, index) => ({
                actionType: 'AD_VIEWED',
                category: null,
                code: `QUEST_${index}`,
                date: '2026-08-12',
                description: `Описание ${index}`,
                progress: index === 0 ? 1 : 0,
                role,
                status: index === 0 ? 'REWARDED' : 'ACTIVE',
                target: 1,
                title: `Задание ${index + 1}`,
                xpReward: 10,
              })),
            },
            tomorrow: {
              date: '2026-08-13',
              streakAfterReturn: 4,
              streakReward: {
                amount: 2,
                source: 'STREAK',
                type: 'AVITO_BONUS',
              },
              tasksCount: 5,
              required: 2,
              buyerTasks: 2,
              sellerTasks: 2,
              universalTasks: 1,
              xpReward: 30,
              reward: { amount: 5, source: 'DAILY_GOAL', type: 'AVITO_BONUS' },
              balancedReward: {
                amount: 3,
                source: 'BALANCED_DAY',
                type: 'AVITO_BONUS',
              },
              nextGoal: null,
            },
          },
        },
      },
    })

    render(
      <Provider store={store}>
        <RetentionPanel />
      </Provider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Выполнено 1 из 2' }),
    ).toBeVisible()
    expect(screen.getAllByText('Покупатель')).toHaveLength(2)
    expect(screen.getAllByText('Продавец')).toHaveLength(2)
    expect(screen.getByText('Для всех')).toBeVisible()
    expect(screen.getByText(/5 новых заданий/)).toBeVisible()
  })
})
