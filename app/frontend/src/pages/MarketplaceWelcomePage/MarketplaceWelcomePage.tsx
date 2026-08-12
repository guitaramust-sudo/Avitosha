import { Link } from 'react-router-dom'

import { iconAssets } from '../../utils/iconAssets'

import '../marketplace-pages.scss'

function MarketplaceWelcomePage() {
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
        </div>
      </div>
      <div className="marketplace-welcome__visual" aria-hidden="true">
        <img src={iconAssets.websiteLogo} alt="" />
        <span>♡</span>
        <span>✓</span>
        <span>+XP</span>
      </div>
    </section>
  )
}

export default MarketplaceWelcomePage
