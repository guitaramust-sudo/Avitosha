import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { registerUser } from '../api/auth'
import { setUser } from '../store/authSlice'
import { beginOnboarding } from '../store/onboardingSlice'
import { markOnboardingPending } from '../utils/onboardingStorage'
import { useAppDispatch } from './redux'
import { currentUserQueryKey } from './useCurrentUserQuery'

export const useRegisterMutation = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (session) => {
      markOnboardingPending(session.user.id)
      dispatch(setUser(session))
      dispatch(beginOnboarding(session.user.id))
      queryClient.setQueryData(currentUserQueryKey, session)
      void navigate('/', { replace: true })
    },
  })
}
