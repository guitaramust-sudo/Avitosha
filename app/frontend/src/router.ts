import { createBrowserRouter } from 'react-router-dom'

import GameLayout from './components/GameLayout/GameLayout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute/PublicOnlyRoute'
import App from './App'

export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: GameLayout,
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('./pages/HomePage/HomePage'))
                    .default,
                }),
              },
              {
                path: 'progress',
                lazy: async () => ({
                  Component: (await import('./pages/ProgressPage/ProgressPage'))
                    .default,
                }),
              },
              {
                path: 'rewards',
                lazy: async () => ({
                  Component: (await import('./pages/RewardsPage/RewardsPage'))
                    .default,
                }),
              },
              {
                path: 'achievements',
                lazy: async () => ({
                  Component: (
                    await import('./pages/AchievementsPage/AchievementsPage')
                  ).default,
                }),
              },
              {
                path: 'leaderboard',
                lazy: async () => ({
                  Component: (
                    await import('./pages/LeaderboardPage/LeaderboardPage')
                  ).default,
                }),
              },
            ],
          },
        ],
      },
      {
        Component: PublicOnlyRoute,
        children: [
          {
            path: 'register',
            lazy: async () => ({
              Component: (await import('./pages/RegisterPage/RegisterPage'))
                .default,
            }),
          },
          {
            path: 'login',
            lazy: async () => ({
              Component: (await import('./pages/LoginPage/LoginPage')).default,
            }),
          },
        ],
      },
      {
        path: '*',
        lazy: async () => ({
          Component: (await import('./pages/ErrorPage/ErrorPage')).default,
        }),
      },
    ],
  },
])
