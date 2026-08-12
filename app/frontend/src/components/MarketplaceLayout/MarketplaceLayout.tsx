import { NavLink, Outlet } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'
import { useGameSocket } from '../../hooks/useGameSocket'
import { iconAssets } from '../../utils/iconAssets'
import ProfileMenu from '../ProfileMenu/ProfileMenu'

import './MarketplaceLayout.scss'

function MarketplaceLayout() {
  const { accessToken, isAuthenticated, user } = useAppSelector(
    (state) => state.auth,
  )
  useGameSocket(accessToken, user?.id)

  return (
    <div className="marketplace-layout">
      <header className="marketplace-header">
        <NavLink className="marketplace-header__brand" to="/marketplace">
          <img src={iconAssets.avitoLogo} alt="" />
          <strong>Avito</strong>
        </NavLink>

        <nav aria-label="Основная навигация">
          <NavLink to="/marketplace/welcome">Как это работает</NavLink>
          {isAuthenticated && <NavLink to="/">Питомец</NavLink>}
          <NavLink end to="/marketplace">
            Объявления
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/marketplace/favorites">Избранное</NavLink>
              <NavLink to="/marketplace/my">Мои объявления</NavLink>
              <NavLink to="/marketplace/profile">Профиль</NavLink>
            </>
          )}
        </nav>

        <div className="marketplace-header__actions">
          {isAuthenticated ? (
            <>
              <NavLink
                className="marketplace-header__create"
                to="/marketplace/new"
              >
                Разместить объявление
              </NavLink>
              <ProfileMenu email={user?.email} />
            </>
          ) : (
            <NavLink className="marketplace-header__login" to="/login">
              Войти
            </NavLink>
          )}
        </div>
      </header>

      <main className="marketplace-layout__content">
        <Outlet />
      </main>
    </div>
  )
}

export default MarketplaceLayout
