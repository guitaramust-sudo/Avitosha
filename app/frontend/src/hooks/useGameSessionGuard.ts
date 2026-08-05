import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { clearUser } from '../store/authSlice'
import { showToast } from '../store/toastSlice'
import { useAppDispatch } from './redux'
import { type GameDashboardQueries, gameQueryKey } from './useGameDashboard'

export const useGameSessionGuard = (dashboard: GameDashboardQueries) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hasAuthenticationError = Object.values(dashboard).some(
    (query) => query.error instanceof ApiError && query.error.status === 401,
  )

  useEffect(() => {
    if (!hasAuthenticationError) {
      return
    }

    queryClient.removeQueries({ queryKey: gameQueryKey() })
    dispatch(clearUser())
    dispatch(
      showToast({
        message: 'Сессия истекла. Войдите в аккаунт снова.',
        tone: 'error',
      }),
    )
    void navigate('/register', { replace: true })
  }, [dispatch, hasAuthenticationError, navigate, queryClient])

  return hasAuthenticationError
}
