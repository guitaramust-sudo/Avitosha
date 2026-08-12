import AchievementsPanel from '../../components/AchievementsPanel/AchievementsPanel'
import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import ProgressOverview from '../../components/ProgressOverview/ProgressOverview'
import RetentionPanel from '../../components/RetentionPanel/RetentionPanel'

import '../game-pages.scss'

function ProgressPage() {
  return (
    <section className="game-section-page">
      <GamePageHeader
        eyebrow="Путь развития"
        title="Задания"
        description="Выполняйте сюжетные и ежедневные задания, следите за историей и наблюдайте, как действия формируют характер питомца."
      />
      <div className="game-section-page__progress-layout">
        <AchievementsPanel view="tasks" />
        <ProgressOverview view="overview" />
      </div>
      <RetentionPanel />
    </section>
  )
}

export default ProgressPage
