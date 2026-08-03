import { createBrowserRouter } from 'react-router-dom'

import ErrorPage from './pages/ErrorPage'
import HomePage from './pages/HomePage'
import App from './App'

export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: '*',
        Component: ErrorPage,
      },
    ],
  },
])
