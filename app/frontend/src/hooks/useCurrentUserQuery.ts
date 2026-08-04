import { queryOptions, useQuery } from '@tanstack/react-query'

import { restoreSession } from '../api/auth'

export const currentUserQueryKey = ['auth', 'current-user'] as const
const SESSION_REFRESH_INTERVAL = 14 * 60 * 1000

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: currentUserQueryKey,
    queryFn: restoreSession,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: 'always',
    refetchInterval: SESSION_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  })

export const useCurrentUserQuery = () => useQuery(currentUserQueryOptions())
