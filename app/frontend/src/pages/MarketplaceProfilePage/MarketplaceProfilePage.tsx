import { Link } from 'react-router-dom'

import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import { useAppSelector } from '../../hooks/redux'

import '../marketplace-pages.scss'

function MarketplaceProfilePage() {
  const user = useAppSelector((state) => state.auth.user)

  return (
    <section className="marketplace-page">
      <GamePageHeader
        eyebrow="Аккаунт"
        title="Профиль пользователя"
        description="Один аккаунт объединяет объявления и персональный прогресс Авитоши."
      />
      <article className="marketplace-profile-card">
        <span>{user?.email.slice(0, 1).toUpperCase() ?? '?'}</span>
        <div>
          <small>Email</small>
          <strong>{user?.email}</strong>
        </div>
        <Link to="/marketplace/my">Мои объявления</Link>
        <Link to="/marketplace/favorites">Избранное</Link>
        <Link to="/">Открыть питомца</Link>
      </article>
    </section>
  )
}

export default MarketplaceProfilePage
