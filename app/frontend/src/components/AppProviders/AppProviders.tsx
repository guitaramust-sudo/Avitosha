import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'

import { store } from '../../store/store'
import AuthInitializer from '../AuthInitializer/AuthInitializer'
import ToastViewport from '../ToastViewport/ToastViewport'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>{children}</AuthInitializer>
        <ToastViewport />
      </QueryClientProvider>
    </Provider>
  )
}

export default AppProviders
