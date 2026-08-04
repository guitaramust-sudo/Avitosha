import { Navigate, Outlet } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'
import AuthRouteLoader from '../AuthRouteLoader/AuthRouteLoader'

function ProtectedRoute() {
  const { isAuthenticated, isAuthInitialized } = useAppSelector(
    (state) => state.auth,
  )

  if (!isAuthInitialized) {
    return <AuthRouteLoader />
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/register" replace />
}

export default ProtectedRoute
