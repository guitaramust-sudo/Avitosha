import type { Achievement, GameTask } from '../../types/game'

import './AchievementsPanel.scss'

interface AchievementsPanelProps {
  tasks: GameTask[]
  achievements: Achievement[]
  isActionPending: boolean
  onAction: (task: GameTask) => void
}

function AchievementsPanel({
  tasks,
  achievements,
  isActionPending,
  onAction,
}: AchievementsPanelProps) {
  const activeTask = tasks.find((task) => task.status === 'ACTIVE')

  return (
    <aside className="achievements-panel">
      <section className="achievements-panel__main">
        <span className="panel-kicker">Текущая просьба</span>
        <h2>{activeTask?.petPhrase ?? 'Комната готова!'}</h2>

        {activeTask ? (
          <article className="task-card">
            <div className="task-card__heading">
              <div>
                <h3>{activeTask.title}</h3>
                <p>{activeTask.description}</p>
              </div>
              <strong>
                {activeTask.progress}/{activeTask.target}
              </strong>
            </div>
            <span className="task-card__progress" aria-hidden="true">
              <i
                style={{
                  width: `${(activeTask.progress / activeTask.target) * 100}%`,
                }}
              />
            </span>
            <div className="task-card__rewards">
              <span>+{activeTask.xpReward} XP</span>
              {activeTask.roomItemCode && (
                <span>⌂ {activeTask.roomItemCode}</span>
              )}
              {activeTask.avitoRewardType && (
                <span>Авито +{activeTask.avitoRewardAmount}</span>
              )}
            </div>
            <button
              className="task-card__action"
              type="button"
              disabled={isActionPending}
              onClick={() => onAction(activeTask)}
            >
              {isActionPending ? 'Обновляем…' : 'Выполнить demo-действие'}
            </button>
          </article>
        ) : (
          <p className="task-card__complete-copy">
            Авитоша теперь чувствует себя как дома. Новая история скоро
            откроется.
          </p>
        )}

        <h2 className="achievements-panel__subtitle">Достижения</h2>
        <div className="achievement-list">
          {achievements.map((achievement) => (
            <article
              className={`achievement ${achievement.unlocked ? '' : 'is-locked'}`}
              key={achievement.code}
            >
              <span
                className="achievement__icon achievement__icon--purple"
                aria-hidden="true"
              >
                {achievement.unlocked ? '★' : '◇'}
              </span>
              <div className="achievement__copy">
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
              </div>
              <span
                className="achievement__complete"
                aria-label={
                  achievement.unlocked ? 'Выполнено' : 'Заблокировано'
                }
              >
                {achievement.unlocked ? '✓' : '·'}
              </span>
            </article>
          ))}
        </div>
      </section>
    </aside>
  )
}

export default AchievementsPanel
