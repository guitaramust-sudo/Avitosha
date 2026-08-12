import { createBrowserRouter } from 'react-router-dom'

import GameLayout from './components/GameLayout/GameLayout'
import MarketplaceLayout from './components/MarketplaceLayout/MarketplaceLayout'
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
        path: 'marketplace',
        Component: MarketplaceLayout,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (
                await import('./pages/MarketplaceCatalogPage/MarketplaceCatalogPage')
              ).default,
            }),
          },
          {
            path: 'welcome',
            lazy: async () => ({
              Component: (
                await import('./pages/MarketplaceWelcomePage/MarketplaceWelcomePage')
              ).default,
            }),
          },
          {
            path: 'listings/:listingId',
            lazy: async () => ({
              Component: (
                await import('./pages/ListingDetailPage/ListingDetailPage')
              ).default,
            }),
          },
          {
            Component: ProtectedRoute,
            children: [
              {
                path: 'my',
                lazy: async () => ({
                  Component: (
                    await import('./pages/MyListingsPage/MyListingsPage')
                  ).default,
                }),
              },
              {
                path: 'favorites',
                lazy: async () => ({
                  Component: (
                    await import('./pages/FavoritesPage/FavoritesPage')
                  ).default,
                }),
              },
              {
                path: 'new',
                lazy: async () => ({
                  Component: (
                    await import('./pages/ListingCreatePage/ListingCreatePage')
                  ).default,
                }),
              },
              {
                path: 'listings/:listingId/edit',
                lazy: async () => ({
                  Component: (
                    await import('./pages/ListingEditPage/ListingEditPage')
                  ).default,
                }),
              },
              {
                path: 'profile',
                lazy: async () => ({
                  Component: (
                    await import('./pages/MarketplaceProfilePage/MarketplaceProfilePage')
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
