import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import ProgressOverview from '../../components/ProgressOverview/ProgressOverview'

import '../game-pages.scss'

function LeaderboardPage() {
  return (
    <section className="game-section-page">
      <GamePageHeader
        eyebrow="Недельная активность"
        title="Лидерборд"
        description="Сравнивайте полезную активность: рейтинг зависит от прогресса, заданий и этапов истории, а не от потраченных денег."
      />
      <ProgressOverview view="leaderboard" />
    </section>
  )
}

export default LeaderboardPage
