import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { logoutUser } from '../api/auth'
import { ApiError } from '../api/client'
import { clearUser } from '../store/authSlice'
import { showToast } from '../store/toastSlice'
import { useAppDispatch } from './redux'
import { currentUserQueryKey } from './useCurrentUserQuery'

export const useLogoutMutation = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const finishLogout = () => {
    queryClient.removeQueries({ queryKey: currentUserQueryKey })
    dispatch(clearUser())
    dispatch(showToast({ message: 'Вы вышли из аккаунта.' }))
    void navigate('/register', { replace: true })
  }

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: finishLogout,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        finishLogout()
        return
      }

      dispatch(
        showToast({
          message: 'Не удалось выйти. Попробуйте ещё раз.',
          tone: 'error',
        }),
      )
    },
  })
}
