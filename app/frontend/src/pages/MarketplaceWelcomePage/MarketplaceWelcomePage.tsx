import { Link } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'

import '../marketplace-pages.scss'

function MarketplaceWelcomePage() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  return (
    <section className="marketplace-welcome">
      <div>
        <span>Mini-Avito × Авитоша</span>
        <h1>Полезные действия становятся личной историей</h1>
        <p>
          Изучайте объявления, общайтесь с продавцами и размещайте свои товары.
          Авитоша будет расти, менять характер и обустраивать комнату вместе с
          вашей активностью.
        </p>
        <div>
          <Link className="marketplace-button" to="/marketplace">
            Смотреть объявления
          </Link>
          <Link
            className="marketplace-button marketplace-button--muted"
            to={isAuthenticated ? '/' : '/register'}
          >
            {isAuthenticated ? 'К питомцу' : 'Создать аккаунт'}
          </Link>
        </div>
      </div>
      <div className="marketplace-welcome__visual" aria-hidden="true">
        <span>♡</span>
        <span>✓</span>
        <span>+XP</span>
      </div>
    </section>
  )
}

export default MarketplaceWelcomePage
