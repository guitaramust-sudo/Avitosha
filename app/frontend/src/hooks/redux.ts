import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '../store/store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

export const useAuthCredentials = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const userId = useAppSelector((state) => state.auth.user?.id)

  return { accessToken, userId }
}
