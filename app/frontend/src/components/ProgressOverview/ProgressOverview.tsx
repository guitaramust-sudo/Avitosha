import { useAppSelector } from '../../hooks/redux'
import {
  selectGameDaily,
  selectGameLeaderboard,
  selectGamePet,
} from '../../store/gameSlice'
import {
  characterIcons,
  formatGameDate,
  moodLabels,
} from '../../utils/gamePresentation'
import RetentionPanel from '../RetentionPanel/RetentionPanel'
import RewardWallet from '../RewardWallet/RewardWallet'

import './ProgressOverview.scss'

function ProgressOverview() {
  const daily = useAppSelector(selectGameDaily)
  const leaderboard = useAppSelector(selectGameLeaderboard)
  const pet = useAppSelector(selectGamePet)

  if (!daily || !leaderboard || !pet) {
    return null
  }

  return (
    <section className="progress-grid" aria-label="Прогресс Авитоши">
      <article className="progress-card character-card">
        <span className="progress-card__icon" aria-hidden="true">
          {characterIcons[pet.characterProfile.iconKey] ?? '⌕'}
        </span>
        <div>
          <small>Характер Авитоши</small>
          <h2>{pet.characterProfile.name}</h2>
          <p>{pet.characterProfile.description}</p>
          <p className="progress-card__detail">
            {pet.characterProfile.visualDetail}
          </p>
          <strong>
            {pet.characterProfile.unlocked
              ? 'Характер открыт'
              : `${pet.characterProfile.progress}/${pet.characterProfile.target} действий`}
          </strong>
        </div>
      </article>

      <article className="progress-card">
        <span className="progress-card__icon" aria-hidden="true">
          ☀
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
      </article>

      <article className="progress-card leaderboard-card">
        <span className="progress-card__icon" aria-hidden="true">
          ♛
        </span>
        <div>
          <small>Неделя с {formatGameDate(leaderboard.weekStart)}</small>
          <h2>Ваше место: {leaderboard.currentUser.position}</h2>
          <p>
            {leaderboard.currentUser.score} очков · уровень{' '}
            {leaderboard.currentUser.level} · заданий{' '}
            {leaderboard.currentUser.completedTasks}
          </p>
          <ol>
            {leaderboard.leaders.map((leader) => (
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
      </article>

      <RewardWallet />
      <RetentionPanel />
    </section>
  )
}

export default ProgressOverview
