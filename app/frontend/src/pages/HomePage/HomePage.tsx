import AchievementsPanel from '../../components/AchievementsPanel/AchievementsPanel'
import HomeHeader from '../../components/HomeHeader/HomeHeader'
import RoomCollection from '../../components/RoomCollection/RoomCollection'
import RoomStage from '../../components/RoomStage/RoomStage'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { useGameAction, useGameDashboard } from '../../hooks/useGameDashboard'
import { useGameSocket } from '../../hooks/useGameSocket'
import { showToast } from '../../store/toastSlice'
import type { GameTask } from '../../types/game'

import './HomePage.scss'

function HomePage() {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const dispatch = useAppDispatch()
  const dashboard = useGameDashboard(accessToken)
  const action = useGameAction(accessToken)
  useGameSocket(accessToken)

  const queries = Object.values(dashboard)
  if (queries.some((query) => query.isPending)) {
    return (
      <main className="game-state" aria-live="polite">
        <span className="game-state__loader" />
        <h1>Авитоша обустраивает комнату…</h1>
      </main>
    )
  }
  if (queries.some((query) => query.isError)) {
    return (
      <main className="game-state">
        <h1>Не удалось открыть комнату</h1>
        <p>Проверьте backend и попробуйте обновить страницу.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Повторить
        </button>
      </main>
    )
  }

  const pet = dashboard.pet.data!
  const tasks = dashboard.tasks.data!
  const room = dashboard.room.data!
  const story = dashboard.story.data!
  const daily = dashboard.daily.data!
  const leaderboard = dashboard.leaderboard.data!
  const achievements = dashboard.achievements.data!

  const performAction = async (task: GameTask) => {
    try {
      const result = await action.mutateAsync({
        eventId: crypto.randomUUID(),
        type: task.actionType,
        entityId: `demo-${crypto.randomUUID()}`,
        ...(task.category ? { category: task.category } : {}),
        occurredAt: new Date().toISOString(),
        metadata: { source: 'avitosha-demo' },
      })
      dispatch(
        showToast({
          message: result.duplicate
            ? 'Это действие уже было учтено.'
            : 'Действие учтено — прогресс обновлён!',
        }),
      )
    } catch {
      dispatch(
        showToast({
          message: 'Не удалось выполнить действие. Попробуйте ещё раз.',
          tone: 'error',
        }),
      )
    }
  }

  return (
    <main className="home-page">
      <div className="home-page__shell">
        <HomeHeader pet={pet} />

        <div className="home-dashboard">
          <AchievementsPanel
            tasks={tasks}
            achievements={achievements}
            isActionPending={action.isPending}
            onAction={(task) => void performAction(task)}
          />

          <div className="home-dashboard__content">
            <RoomStage pet={pet} items={room.items} story={story} />
            <RoomCollection items={room.items} />

            <section className="progress-grid">
              <article className="progress-card character-card">
                <span className="progress-card__icon">⌕</span>
                <div>
                  <small>Характер Авитоши</small>
                  <h2>{pet.characterProfile.name}</h2>
                  <p>{pet.characterProfile.description}</p>
                  <strong>
                    {pet.characterProfile.unlocked
                      ? 'Характер открыт'
                      : `${pet.characterProfile.progress}/${pet.characterProfile.target} действий`}
                  </strong>
                </div>
              </article>

              <article className="progress-card">
                <span className="progress-card__icon">☀</span>
                <div>
                  <small>Сегодня вместе</small>
                  <h2>+{daily.earnedXp} XP</h2>
                  <p>
                    {daily.actionsCount} действий · {daily.completedTasks}{' '}
                    заданий · {daily.unlockedRoomItems.length} предметов
                  </p>
                  <strong>
                    Этапы {daily.storyStageBefore} → {daily.storyStageAfter}
                  </strong>
                </div>
              </article>

              <article className="progress-card leaderboard-card">
                <span className="progress-card__icon">♛</span>
                <div>
                  <small>Недельный лидерборд</small>
                  <h2>Ваше место: {leaderboard.currentUser.position}</h2>
                  <p>{leaderboard.currentUser.score} очков заботы</p>
                  <ol>
                    {leaderboard.leaders.slice(0, 3).map((leader) => (
                      <li key={leader.userId}>
                        <span>
                          {leader.position}. {leader.petName}
                        </span>
                        <strong>{leader.score}</strong>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default HomePage
