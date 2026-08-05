import AchievementsPanel from '../../components/AchievementsPanel/AchievementsPanel'
import HomeHeader from '../../components/HomeHeader/HomeHeader'
import ProgressOverview from '../../components/ProgressOverview/ProgressOverview'
import RoomWorkspace from '../../components/RoomWorkspace/RoomWorkspace'
import { useAppSelector } from '../../hooks/redux'
import { useGameDashboard } from '../../hooks/useGameDashboard'
import { useGameDashboardSync } from '../../hooks/useGameDashboardSync'
import { useGameSessionGuard } from '../../hooks/useGameSessionGuard'
import { useGameSocket } from '../../hooks/useGameSocket'

import './HomePage.scss'

function HomePage() {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const dashboard = useGameDashboard(accessToken, userId)
  const isGameReady = useGameDashboardSync(userId, dashboard)
  const hasAuthenticationError = useGameSessionGuard(dashboard)
  useGameSocket(accessToken, userId)

  const queries = Object.values(dashboard)
  const hasQueryError = queries.some((query) => query.isError)

  if (hasAuthenticationError) {
    return null
  }

  if (
    queries.some((query) => query.isPending) ||
    (!hasQueryError && !isGameReady)
  ) {
    return (
      <main className="game-state" aria-live="polite">
        <span className="game-state__loader" />
        <h1>Авитоша обустраивает комнату…</h1>
      </main>
    )
  }
  if (hasQueryError) {
    return (
      <main className="game-state">
        <h1>Не удалось открыть комнату</h1>
        <p>Проверьте backend и попробуйте обновить страницу.</p>
        <button
          type="button"
          onClick={() => {
            void Promise.all(
              queries
                .filter((query) => query.isError)
                .map((query) => query.refetch()),
            )
          }}
        >
          Повторить
        </button>
      </main>
    )
  }

  return (
    <main className="home-page">
      <div className="home-page__shell">
        <HomeHeader />

        <div className="home-dashboard">
          <AchievementsPanel />

          <div className="home-dashboard__content">
            <RoomWorkspace />
            <ProgressOverview />
          </div>
        </div>
      </div>
    </main>
  )
}

export default HomePage
