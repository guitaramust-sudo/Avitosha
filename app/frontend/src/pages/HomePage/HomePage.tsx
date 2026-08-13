import { Link } from 'react-router-dom'

import FrequentlyAskedQuestions from '../../components/FrequentlyAskedQuestions/FrequentlyAskedQuestions'
import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import RoomWorkspace from '../../components/RoomWorkspace/RoomWorkspace'
import { useAppSelector } from '../../hooks/redux'
import {
  selectGameDaily,
  selectGamePet,
  selectGameTasks,
  selectGameWallet,
} from '../../store/gameSlice'
import { moodLabels } from '../../utils/gamePresentation'

import './HomePage.scss'

function HomePage() {
  const daily = useAppSelector(selectGameDaily)
  const pet = useAppSelector(selectGamePet)
  const tasks = useAppSelector(selectGameTasks)
  const wallet = useAppSelector(selectGameWallet)
  const activeTask = tasks.find((task) => task.status === 'ACTIVE')

  return (
    <section className="home-page">
      <GamePageHeader
        eyebrow="Дом Авитоши"
        title={`Привет, я ${pet?.name ?? 'Авитоша'}`}
        description="Развивайте питомца полезными действиями на Авито и создавайте его личное пространство."
        action={
          <Link className="home-page__primary-action" to="/progress">
            Открыть задания
          </Link>
        }
      />

      <div className="home-page__status-grid">
        <article>
          <span>Текущая цель</span>
          <strong>{activeTask?.title ?? 'Первая комната готова'}</strong>
          <small>
            {activeTask
              ? `${activeTask.progress}/${activeTask.target} · +${activeTask.xpReward} XP`
              : 'Все сюжетные задания выполнены'}
          </small>
        </article>
        <article>
          <span>Сегодня</span>
          <strong>+{daily?.earnedXp ?? 0} XP</strong>
          <small>{daily?.actionsCount ?? 0} полезных действий</small>
        </article>
        <article>
          <span>Настроение</span>
          <strong>{pet ? moodLabels[pet.mood] : 'Загрузка…'}</strong>
          <small>{pet?.characterProfile.name ?? 'Характер формируется'}</small>
        </article>
        <article>
          <span>Баланс</span>
          <strong>{wallet?.balance.balance ?? 0} бонусов</strong>
          <small>
            {wallet?.nextGoal
              ? `${wallet.nextGoal.remaining} до следующей награды`
              : 'Каталог наград открыт'}
          </small>
        </article>
      </div>

      <div className="home-page__room">
        <RoomWorkspace />
      </div>

      <FrequentlyAskedQuestions />
    </section>
  )
}

export default HomePage
