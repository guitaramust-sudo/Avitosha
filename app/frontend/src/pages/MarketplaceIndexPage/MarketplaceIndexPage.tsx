import { Navigate } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'
import MarketplaceWelcomePage from '../MarketplaceWelcomePage/MarketplaceWelcomePage'

function MarketplaceIndexPage() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  return isAuthenticated ? (
    <Navigate replace to="/marketplace/listings" />
  ) : (
    <MarketplaceWelcomePage />
  )
}

export default MarketplaceIndexPage
