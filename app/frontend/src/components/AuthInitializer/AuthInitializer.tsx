import { type PropsWithChildren, useEffect } from 'react'

import { ApiError } from '../../api/client'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { useCurrentUserQuery } from '../../hooks/useCurrentUserQuery'
import { clearUser, setUser } from '../../store/authSlice'

function AuthInitializer({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch()
  const isAuthInitialized = useAppSelector(
    (state) => state.auth.isAuthInitialized,
  )
  const currentUserQuery = useCurrentUserQuery()

  useEffect(() => {
    if (currentUserQuery.isSuccess) {
      dispatch(setUser(currentUserQuery.data))
    }

    const isAuthenticationError =
      currentUserQuery.error instanceof ApiError &&
      currentUserQuery.error.status === 401

    if (
      currentUserQuery.isError &&
      (!isAuthInitialized || isAuthenticationError)
    ) {
      dispatch(clearUser())
    }
  }, [
    currentUserQuery.data,
    currentUserQuery.error,
    currentUserQuery.isError,
    currentUserQuery.isSuccess,
    dispatch,
    isAuthInitialized,
  ])

  return children
}

export default AuthInitializer
