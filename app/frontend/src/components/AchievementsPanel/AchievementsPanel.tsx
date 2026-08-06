import { useCallback, useState } from 'react'

import { useAppSelector } from '../../hooks/redux'
import { useTaskAction } from '../../hooks/useTaskAction'
import { selectGameAchievements, selectGameTasks } from '../../store/gameSlice'
import {
  formatGameDateTime,
  roomItemLabels,
  taskActionLabels,
  taskStatusLabels,
} from '../../utils/gamePresentation'
import { achievementIconAssets, iconAssets } from '../../utils/iconAssets'
import CollapsibleSection from '../CollapsibleSection/CollapsibleSection'
import TaskDetailsDialog from '../TaskDetailsDialog/TaskDetailsDialog'

import './AchievementsPanel.scss'

function AchievementsPanel() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const achievements = useAppSelector(selectGameAchievements)
  const tasks = useAppSelector(selectGameTasks)
  const { isPending, performTaskAction } = useTaskAction(accessToken, userId)
  const activeTask = tasks.find((task) => task.status === 'ACTIVE')
  const closeTaskDetails = useCallback(() => setSelectedTaskId(null), [])

  return (
    <>
      <CollapsibleSection
        as="aside"
        className="achievements-panel"
        title="Задания и достижения"
        tourId="tasks"
      >
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
                  <span>
                    ⌂{' '}
                    {roomItemLabels[activeTask.roomItemCode] ??
                      activeTask.roomItemCode}
                  </span>
                )}
                {activeTask.avitoRewardType && (
                  <span>+{activeTask.avitoRewardAmount} бонусов Авито</span>
                )}
              </div>
              <button
                className="task-card__action"
                type="button"
                disabled={isPending}
                onClick={() => void performTaskAction(activeTask)}
              >
                {isPending
                  ? 'Обновляем…'
                  : taskActionLabels[activeTask.actionType]}
              </button>
            </article>
          ) : (
            <p className="task-card__complete-copy">
              Авитоша теперь чувствует себя как дома. Новая история скоро
              откроется.
            </p>
          )}

          <h2 className="achievements-panel__subtitle">Задания истории</h2>
          <ol className="task-history">
            {tasks.map((task) => (
              <li
                className={`task-history__item task-history__item--${task.status.toLowerCase()}`}
                key={task.id}
                aria-current={task.status === 'ACTIVE' ? 'step' : undefined}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <span className="task-history__stage" aria-hidden="true">
                    {task.status === 'REWARDED' || task.status === 'COMPLETED'
                      ? '✓'
                      : (task.storyStage ?? '·')}
                  </span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      {task.progress}/{task.target} ·{' '}
                      {taskStatusLabels[task.status]}
                    </small>
                  </span>
                  <i aria-hidden="true">›</i>
                </button>
              </li>
            ))}
          </ol>

          <h2 className="achievements-panel__subtitle">Достижения</h2>
          <div className="achievement-list">
            {achievements.map((achievement) => (
              <article
                className={`achievement ${achievement.unlocked ? '' : 'is-locked'}`}
                key={achievement.code}
                title={
                  achievement.unlockedAt
                    ? `Открыто ${formatGameDateTime(achievement.unlockedAt)}`
                    : achievement.description
                }
              >
                <span
                  className="achievement__icon achievement__icon--purple"
                  aria-hidden="true"
                >
                  <img
                    src={
                      achievement.unlocked
                        ? (achievementIconAssets[achievement.iconKey] ??
                          iconAssets.star)
                        : iconAssets.lock
                    }
                    alt=""
                  />
                </span>
                <div className="achievement__copy">
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                  {achievement.unlockedAt && (
                    <time dateTime={achievement.unlockedAt}>
                      {formatGameDateTime(achievement.unlockedAt)}
                    </time>
                  )}
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
      </CollapsibleSection>
      <TaskDetailsDialog taskId={selectedTaskId} onClose={closeTaskDetails} />
    </>
  )
}

export default AchievementsPanel
