import { Link } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'
import { selectGameDaily } from '../../store/gameSlice'
import { formatGameDate, taskActionLabels } from '../../utils/gamePresentation'
import { iconAssets } from '../../utils/iconAssets'
import CollapsibleSection from '../CollapsibleSection/CollapsibleSection'

import './RetentionPanel.scss'

const roleLabels = {
  BUYER: 'Покупатель',
  SELLER: 'Продавец',
  UNIVERSAL: 'Для всех',
} as const

const getQuestPath = (actionType: string, category: string | null) => {
  if (actionType === 'AD_CREATED') return '/marketplace/new'
  if (actionType === 'LISTING_IMPROVED') return '/marketplace/my'

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  const search = params.toString()
  return `/marketplace${search ? `?${search}` : ''}`
}

function RetentionPanel() {
  const daily = useAppSelector(selectGameDaily)

  if (!daily) return null

  const { dailyGoal, streak, tomorrow } = daily.retention
  const goalCompleted = dailyGoal.status === 'REWARDED'

  return (
    <CollapsibleSection
      className="progress-card retention-card"
      title="Ежедневные задания"
      tourId="retention"
    >
      <span
        className="progress-card__icon retention-card__icon"
        aria-hidden="true"
      >
        <img src={iconAssets.fire} alt="" />
      </span>
      <div className="retention-card__content">
        <div className="retention-card__heading">
          <div>
            <small>Ежедневная цель</small>
            <h2>
              Выполнено {dailyGoal.completed} из {dailyGoal.required}
            </h2>
          </div>
          <span className={goalCompleted ? 'is-active' : ''}>
            {goalCompleted
              ? `+${dailyGoal.xpReward} XP и +${dailyGoal.reward.amount} бонусов`
              : `${streak.current} дней подряд`}
          </span>
        </div>

        <div className="daily-quest-list">
          {dailyGoal.quests.map((quest) => {
            const completed = ['COMPLETED', 'REWARDED'].includes(quest.status)
            const percent = quest.target
              ? Math.min(100, (quest.progress / quest.target) * 100)
              : 0

            return (
              <section
                className={`daily-quest ${completed ? 'is-completed' : ''}`}
                key={quest.code}
              >
                <div className="daily-quest__heading">
                  <span
                    className={`daily-quest__role is-${quest.role.toLowerCase()}`}
                  >
                    {roleLabels[quest.role]}
                  </span>
                  <strong>+{quest.xpReward} XP</strong>
                </div>
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
                <span
                  className="daily-quest__progress"
                  role="progressbar"
                  aria-label={`Прогресс задания ${quest.title}`}
                  aria-valuemin={0}
                  aria-valuemax={quest.target}
                  aria-valuenow={quest.progress}
                >
                  <i style={{ width: `${percent}%` }} />
                </span>
                <strong>
                  {completed
                    ? 'Выполнено'
                    : `${quest.progress}/${quest.target}`}
                </strong>
                {!completed && (
                  <Link
                    className="daily-quest__action"
                    to={getQuestPath(quest.actionType, quest.category)}
                  >
                    {taskActionLabels[quest.actionType]}
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </section>
            )
          })}
        </div>

        <div className="retention-card__columns">
          <section className="balanced-day">
            <span>Дополнительная цель</span>
            <h3>Попробуйте обе роли</h3>
            <p>Выполните задание покупателя и продавца.</p>
            <strong>
              {dailyGoal.balancedCompleted
                ? 'Бонус получен'
                : `+${dailyGoal.balancedReward.amount} бонуса`}
            </strong>
          </section>

          <section className="tomorrow-preview">
            <span>Завтра · {formatGameDate(tomorrow.date)}</span>
            <h3>{tomorrow.tasksCount} новых заданий</h3>
            <p>
              {tomorrow.buyerTasks} покупателя · {tomorrow.sellerTasks} продавца
              · {tomorrow.universalTasks} для всех. Выполните любые{' '}
              {tomorrow.required}.
            </p>
            <div>
              <span>Серия станет {tomorrow.streakAfterReturn}</span>
              <strong>
                +{tomorrow.xpReward} XP и +{tomorrow.reward.amount} бонусов
              </strong>
            </div>
          </section>
        </div>

        <small className="retention-card__record">
          Серия продлевается после выполнения дневной цели. Лучшая серия:{' '}
          {streak.longest} дней · защита серии: {streak.protections}
        </small>
      </div>
    </CollapsibleSection>
  )
}

export default RetentionPanel
