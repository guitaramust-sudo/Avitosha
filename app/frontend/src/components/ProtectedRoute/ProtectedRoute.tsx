import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'
import AuthRouteLoader from '../AuthRouteLoader/AuthRouteLoader'

function ProtectedRoute() {
  const { pathname } = useLocation()
  const { isAuthenticated, isAuthInitialized } = useAppSelector(
    (state) => state.auth,
  )

  if (!isAuthInitialized) {
    return <AuthRouteLoader />
  }

  if (isAuthenticated) return <Outlet />

  return (
    <Navigate replace to={pathname === '/' ? '/marketplace' : '/register'} />
  )
}

export default ProtectedRoute
