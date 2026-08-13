import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'
import { useGameSocket } from '../../hooks/useGameSocket'
import { iconAssets } from '../../utils/iconAssets'
import ProfileMenu from '../ProfileMenu/ProfileMenu'

import './MarketplaceLayout.scss'

function MarketplaceLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { accessToken, isAuthenticated, user } = useAppSelector(
    (state) => state.auth,
  )
  useGameSocket(accessToken, user?.id)

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMobileMenuOpen])

  return (
    <div className="marketplace-layout">
      <header
        className={`marketplace-header ${isMobileMenuOpen ? 'is-menu-open' : ''}`}
      >
        <NavLink className="marketplace-header__brand" to="/marketplace">
          <img src={iconAssets.avitoLogo} alt="" />
          <strong>Avito</strong>
        </NavLink>

        <nav
          className="marketplace-header__desktop-navigation"
          aria-label="Основная навигация"
        >
          <NavLink to="/marketplace/welcome">Как это работает</NavLink>
          {isAuthenticated && (
            <NavLink end to="/" onClick={() => setIsMobileMenuOpen(false)}>
              Питомец
            </NavLink>
          )}
          <NavLink
            to="/marketplace/listings"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Объявления
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink
                to="/marketplace/favorites"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Избранное
              </NavLink>
              <NavLink
                to="/marketplace/my"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Мои объявления
              </NavLink>
              <NavLink
                to="/marketplace/profile"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Профиль
              </NavLink>
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
              <button
                className={`marketplace-header__menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
                type="button"
                aria-controls="marketplace-mobile-menu"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                onClick={() => setIsMobileMenuOpen((current) => !current)}
              >
                <span />
                <span />
                <span />
              </button>
            </>
          ) : (
            <>
              <NavLink className="marketplace-header__login" to="/login">
                Войти
              </NavLink>
              <button
                className={`marketplace-header__menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
                type="button"
                aria-controls="marketplace-mobile-menu"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                onClick={() => setIsMobileMenuOpen((current) => !current)}
              >
                <span />
                <span />
                <span />
              </button>
            </>
          )}
        </div>
      </header>

      <aside
        className={`marketplace-mobile-menu ${isMobileMenuOpen ? 'is-open' : ''}`}
        id="marketplace-mobile-menu"
        aria-hidden={!isMobileMenuOpen}
        aria-label="Мобильная навигация"
      >
        <nav>
          <NavLink
            to="/marketplace/welcome"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Как это работает
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>
              Питомец
            </NavLink>
          )}
          <NavLink
            to="/marketplace/listings"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Объявления
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink
                to="/marketplace/favorites"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Избранное
              </NavLink>
              <NavLink
                to="/marketplace/my"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Мои объявления
              </NavLink>
              <NavLink
                to="/marketplace/profile"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Профиль
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="marketplace-layout__content" inert={isMobileMenuOpen}>
        <Outlet />
      </main>
    </div>
  )
}

export default MarketplaceLayout
