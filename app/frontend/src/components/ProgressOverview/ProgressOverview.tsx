import { useAppSelector } from '../../hooks/redux'
import {
  selectGameDaily,
  selectGameLeaderboard,
  selectGamePet,
} from '../../store/gameSlice'
import { formatGameDate, moodLabels } from '../../utils/gamePresentation'
import { characterIconAssets, iconAssets } from '../../utils/iconAssets'
import CollapsibleSection from '../CollapsibleSection/CollapsibleSection'
import RetentionPanel from '../RetentionPanel/RetentionPanel'
import RewardWallet from '../RewardWallet/RewardWallet'

import './ProgressOverview.scss'

interface ProgressOverviewProps {
  view?: 'all' | 'leaderboard' | 'overview'
}

function ProgressOverview({ view = 'all' }: ProgressOverviewProps) {
  const daily = useAppSelector(selectGameDaily)
  const leaderboard = useAppSelector(selectGameLeaderboard)
  const pet = useAppSelector(selectGamePet)

  if (!daily || !leaderboard || !pet) return null

  const topLeaders = [...leaderboard.leaders]
    .sort((left, right) => left.position - right.position)
    .slice(0, 10)
  const showOverview = view !== 'leaderboard'
  const showLeaderboard = view !== 'overview'

  return (
    <section
      className="progress-grid"
      aria-label="Задания и статистика Авитоши"
    >
      {showOverview && (
        <CollapsibleSection
          className="progress-card character-card"
          title="Характер Авитоши"
          tourId="character"
        >
          <span className="progress-card__icon" aria-hidden="true">
            <img
              src={
                characterIconAssets[pet.characterProfile.iconKey] ??
                iconAssets.magnifier
              }
              alt=""
            />
          </span>
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
        </CollapsibleSection>
      )}

      {showOverview && (
        <CollapsibleSection
          className="progress-card"
          title="Дневная сводка"
          tourId="daily-summary"
        >
          <span className="progress-card__icon" aria-hidden="true">
            <img src={iconAssets.sun} alt="" />
          </span>
          <div>
            <small>Сводка за {formatGameDate(daily.date)}</small>
            <h2>+{daily.earnedXp} XP</h2>
            <dl className="progress-card__facts">
              <div>
                <dt>Действия</dt>
                <dd>{daily.actionsCount}</dd>
              </div>
              <div>
                <dt>Задания</dt>
                <dd>{daily.completedTasks}</dd>
              </div>
              <div>
                <dt>Новые предметы</dt>
                <dd>{daily.unlockedRoomItems.length}</dd>
              </div>
              <div>
                <dt>Уровень</dt>
                <dd>
                  {daily.levelBefore} → {daily.levelAfter}
                </dd>
              </div>
              <div>
                <dt>Этап истории</dt>
                <dd>
                  {daily.storyStageBefore} → {daily.storyStageAfter}
                </dd>
              </div>
              <div>
                <dt>Рейтинг</dt>
                <dd>
                  {daily.weeklyScoreDelta >= 0 ? '+' : ''}
                  {daily.weeklyScoreDelta} · место {daily.weeklyPosition ?? '—'}
                </dd>
              </div>
            </dl>
            <strong>Настроение: {moodLabels[daily.petMood]}</strong>
          </div>
        </CollapsibleSection>
      )}

      {showLeaderboard && (
        <CollapsibleSection
          className="progress-card leaderboard-card"
          title="Таблица лидеров"
          tourId="leaderboard"
        >
          <span className="progress-card__icon" aria-hidden="true">
            <img src={iconAssets.crown} alt="" />
          </span>
          <div>
            <small>Неделя с {formatGameDate(leaderboard.weekStart)}</small>
            <h2>Ваше место: {leaderboard.currentUser.position}</h2>
            <p>
              {leaderboard.currentUser.score} очков · уровень{' '}
              {leaderboard.currentUser.level} · заданий{' '}
              {leaderboard.currentUser.completedTasks}
            </p>
            <details className="leaderboard-card__score-help">
              <summary>Как считается рейтинг?</summary>
              <div>
                <strong>Рейтинг за неделю</strong>
                <p>XP, заработанный за эту неделю</p>
                <p>+ 20 очков за каждую выполненную задачу</p>
                <p>+ 50 очков за каждый пройденный этап истории</p>
                <dl>
                  <div>
                    <dt>Выполнено задач</dt>
                    <dd>
                      {leaderboard.currentUser.completedTasks} → +
                      {leaderboard.currentUser.completedTasks * 20}
                    </dd>
                  </div>
                  <div>
                    <dt>Итоговый рейтинг</dt>
                    <dd>{leaderboard.currentUser.score}</dd>
                  </div>
                </dl>
                <small>
                  Это недельный рейтинг, а не общий XP питомца, поэтому значения
                  могут отличаться.
                </small>
              </div>
            </details>
            <ol>
              {topLeaders.map((leader) => (
                <li
                  key={leader.userId}
                  aria-current={
                    leader.userId === leaderboard.currentUser.userId
                      ? 'true'
                      : undefined
                  }
                >
                  <span className="leaderboard-card__player">
                    <strong>{leader.position}</strong>
                    <span>
                      {leader.petName}
                      <small>
                        Ур. {leader.level} · {leader.completedTasks} заданий
                      </small>
                    </span>
                  </span>
                  <strong>{leader.score}</strong>
                </li>
              ))}
            </ol>
          </div>
        </CollapsibleSection>
      )}

      {view === 'all' && <RewardWallet />}
      {view === 'all' && <RetentionPanel />}
    </section>
  )
}

export default ProgressOverview
