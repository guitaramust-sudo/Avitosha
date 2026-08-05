import type { ReactNode } from 'react'

import { useAppSelector } from '../../hooks/redux'
import { selectGamePet, selectGameRoom } from '../../store/gameSlice'
import { getLevelXpFloor, moodLabels } from '../../utils/gamePresentation'
import ProfileMenu from '../ProfileMenu/ProfileMenu'

import './HomeHeader.scss'

interface HeaderStatProps {
  icon: string
  label: string
  tone: 'blue' | 'green' | 'purple'
  children: ReactNode
}

function HeaderStat({ icon, label, tone, children }: HeaderStatProps) {
  return (
    <section className="header-stat">
      <span className={`header-stat__icon header-stat__icon--${tone}`}>
        {icon}
      </span>
      <div className="header-stat__content">
        <span className="header-stat__label">{label}</span>
        {children}
      </div>
    </section>
  )
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <i className="brand-mark__dot brand-mark__dot--blue" />
      <i className="brand-mark__dot brand-mark__dot--green" />
      <i className="brand-mark__dot brand-mark__dot--red" />
      <i className="brand-mark__dot brand-mark__dot--purple" />
    </div>
  )
}

function HomeHeader() {
  const email = useAppSelector((state) => state.auth.user?.email)
  const pet = useAppSelector(selectGamePet)
  const room = useAppSelector(selectGameRoom)
  const currentXpFloor = pet ? getLevelXpFloor(pet.level) : 0
  const levelSpan = pet?.nextLevelXp ? pet.nextLevelXp - currentXpFloor : 1
  const levelProgress = !pet
    ? 0
    : pet.nextLevelXp === null
      ? 100
      : Math.min(
          100,
          Math.max(0, ((pet.growthXp - currentXpFloor) / levelSpan) * 100),
        )

  return (
    <header className="home-header">
      <div className="home-header__brand">
        <BrandMark />
        <span>Авитоша</span>
      </div>

      <div className="home-header__stats">
        <HeaderStat icon="★" label={`Уровень ${pet?.level ?? 1}`} tone="purple">
          <div
            className="level-progress"
            aria-label={`${pet?.growthXp ?? 0} опыта`}
          >
            <span className="level-progress__track">
              <i style={{ width: `${levelProgress}%` }} />
            </span>
            <span>
              <strong>{pet?.growthXp ?? 0}</strong>
              {pet?.nextLevelXp ? ` / ${pet.nextLevelXp} XP` : ' XP · максимум'}
            </span>
          </div>
        </HeaderStat>

        <HeaderStat icon="☺" label="Настроение" tone="green">
          <strong className="header-stat__value header-stat__value--green">
            {pet ? moodLabels[pet.mood] : 'Загрузка…'}
          </strong>
        </HeaderStat>

        <HeaderStat icon="◎" label="Цель" tone="blue">
          <div className="goal-progress">
            <strong>Обустроить комнату</strong>
            <span>{room?.progress ?? '0/6'} предметов</span>
          </div>
        </HeaderStat>
      </div>

      <div className="home-header__actions">
        <ProfileMenu email={email} />
      </div>
    </header>
  )
}

export default HomeHeader
