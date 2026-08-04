import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { loginUser } from '../api/auth'
import { setUser } from '../store/authSlice'
import { useAppDispatch } from './redux'
import { currentUserQueryKey } from './useCurrentUserQuery'

export const useLoginMutation = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (session) => {
      dispatch(setUser(session))
      queryClient.setQueryData(currentUserQueryKey, session)
      void navigate('/', { replace: true })
    },
  })
}
