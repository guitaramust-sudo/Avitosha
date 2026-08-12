import AchievementsPanel from '../../components/AchievementsPanel/AchievementsPanel'
import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'

import '../game-pages.scss'

function AchievementsPage() {
  return (
    <section className="game-section-page">
      <GamePageHeader
        eyebrow="Личная коллекция"
        title="Достижения"
        description="Каждое достижение фиксирует важный шаг пользователя и уникальную часть истории его Авитоши."
      />
      <AchievementsPanel view="achievements" />
    </section>
  )
}

export default AchievementsPage
