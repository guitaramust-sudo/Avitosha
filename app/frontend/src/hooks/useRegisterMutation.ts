import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { registerUser } from '../api/auth'
import { setUser } from '../store/authSlice'
import { useAppDispatch } from './redux'
import { currentUserQueryKey } from './useCurrentUserQuery'

export const useRegisterMutation = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (session) => {
      dispatch(setUser(session))
      queryClient.setQueryData(currentUserQueryKey, session)
      void navigate('/', { replace: true })
    },
  })
}
