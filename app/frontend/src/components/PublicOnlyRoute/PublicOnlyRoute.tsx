import { Navigate, Outlet } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'
import AuthRouteLoader from '../AuthRouteLoader/AuthRouteLoader'

function PublicOnlyRoute() {
  const { isAuthenticated, isAuthInitialized } = useAppSelector(
    (state) => state.auth,
  )

  if (!isAuthInitialized) {
    return <AuthRouteLoader />
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}

export default PublicOnlyRoute
