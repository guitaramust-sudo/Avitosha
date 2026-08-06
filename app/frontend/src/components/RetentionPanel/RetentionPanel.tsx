import { useAppSelector } from '../../hooks/redux'
import { selectGameDaily } from '../../store/gameSlice'
import { formatGameDate } from '../../utils/gamePresentation'
import { iconAssets } from '../../utils/iconAssets'
import CollapsibleSection from '../CollapsibleSection/CollapsibleSection'

import './RetentionPanel.scss'

function RetentionPanel() {
  const daily = useAppSelector(selectGameDaily)

  if (!daily) return null

  const { dailyQuest, streak, tomorrow } = daily.retention
  const questPercent = dailyQuest.target
    ? Math.min(100, (dailyQuest.progress / dailyQuest.target) * 100)
    : 0
  const questCompleted = ['COMPLETED', 'REWARDED'].includes(dailyQuest.status)

  return (
    <CollapsibleSection
      className="progress-card retention-card"
      title="Ежедневный возврат"
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
            <small>Ежедневный возврат</small>
            <h2>{streak.current} дней подряд</h2>
          </div>
          <span className={streak.activeToday ? 'is-active' : ''}>
            {streak.activeToday ? 'Сегодня засчитано' : 'Зайдите сегодня'}
          </span>
        </div>

        <div className="retention-card__columns">
          <section className="daily-quest">
            <div className="daily-quest__heading">
              <span>Задание на сегодня</span>
              <strong>+{dailyQuest.reward.amount} бонусов</strong>
            </div>
            <h3>{dailyQuest.title}</h3>
            <p>{dailyQuest.description}</p>
            <span
              className="daily-quest__progress"
              role="progressbar"
              aria-label={`Прогресс задания ${dailyQuest.title}`}
              aria-valuemin={0}
              aria-valuemax={dailyQuest.target}
              aria-valuenow={dailyQuest.progress}
            >
              <i style={{ width: `${questPercent}%` }} />
            </span>
            <strong>
              {questCompleted
                ? 'Задание выполнено'
                : `${dailyQuest.progress}/${dailyQuest.target}`}
            </strong>
          </section>

          <section className="tomorrow-preview">
            <span>Завтра · {formatGameDate(tomorrow.date)}</span>
            <h3>{tomorrow.dailyQuest.title}</h3>
            <p>{tomorrow.dailyQuest.description}</p>
            <div>
              <span>Серия станет {tomorrow.streakAfterReturn}</span>
              <strong>+{tomorrow.streakReward.amount} бонусов за вход</strong>
            </div>
            {tomorrow.nextGoal && (
              <small>
                Следующая награда: {tomorrow.nextGoal.title} · осталось{' '}
                {tomorrow.nextGoal.remaining}
              </small>
            )}
          </section>
        </div>

        <small className="retention-card__record">
          Лучшая серия: {streak.longest} дней
        </small>
      </div>
    </CollapsibleSection>
  )
}

export default RetentionPanel
