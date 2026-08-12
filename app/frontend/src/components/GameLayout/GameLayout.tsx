import { Outlet } from 'react-router-dom'

import { useAuthCredentials } from '../../hooks/redux'
import { useGameDashboard } from '../../hooks/useGameDashboard'
import { useGameDashboardSync } from '../../hooks/useGameDashboardSync'
import { useGameSessionGuard } from '../../hooks/useGameSessionGuard'
import { useGameSocket } from '../../hooks/useGameSocket'
import FirstVisitOnboarding from '../FirstVisitOnboarding/FirstVisitOnboarding'
import GameNavigation from '../GameNavigation/GameNavigation'

import './GameLayout.scss'

function GameLayout() {
  const { accessToken, userId } = useAuthCredentials()
  const dashboard = useGameDashboard(accessToken, userId)
  const isGameReady = useGameDashboardSync(userId, dashboard)
  const hasAuthenticationError = useGameSessionGuard(dashboard)
  useGameSocket(accessToken, userId)

  const queries = Object.values(dashboard)
  const hasQueryError = queries.some((query) => query.isError)

  if (hasAuthenticationError) return null

  if (
    queries.some((query) => query.isPending) ||
    (!hasQueryError && !isGameReady)
  ) {
    return (
      <main className="game-state" aria-live="polite">
        <span className="game-state__loader" />
        <h1>Авитоша готовит кабинет…</h1>
      </main>
    )
  }

  if (hasQueryError) {
    return (
      <main className="game-state">
        <h1>Не удалось открыть кабинет</h1>
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
    <main className="game-layout">
      <GameNavigation />
      <div className="game-layout__content">
        <Outlet />
      </div>
      <FirstVisitOnboarding />
    </main>
  )
}

export default GameLayout
