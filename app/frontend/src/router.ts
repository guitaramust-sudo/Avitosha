import { createBrowserRouter } from 'react-router-dom'

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
            index: true,
            lazy: async () => ({
              Component: (await import('./pages/HomePage/HomePage')).default,
            }),
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
