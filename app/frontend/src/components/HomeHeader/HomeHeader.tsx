import type { ReactNode } from 'react'

import { useAppSelector } from '../../hooks/redux'
import type { PetProfile } from '../../types/game'
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

const moodLabels = {
  CALM: 'Спокоен',
  CURIOUS: 'Заинтересован',
  HAPPY: 'Рад',
  EXCITED: 'В восторге',
  PROUD: 'Гордится',
  SLEEPING: 'Отдыхает',
}

interface HomeHeaderProps {
  pet?: PetProfile
}

function HomeHeader({ pet }: HomeHeaderProps) {
  const email = useAppSelector((state) => state.auth.user?.email)
  const currentXpFloor =
    pet?.level === 2
      ? 100
      : pet?.level === 3
        ? 250
        : pet?.level === 4
          ? 450
          : pet?.level === 5
            ? 700
            : 0
  const levelSpan = pet?.nextLevelXp ? pet.nextLevelXp - currentXpFloor : 1
  const levelProgress = pet
    ? Math.min(100, ((pet.growthXp - currentXpFloor) / levelSpan) * 100)
    : 0

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
            <strong>{pet?.currentStory.title ?? 'Обустроить комнату'}</strong>
            <span>
              {pet?.currentStory.currentStage ?? 0} /{' '}
              {pet?.currentStory.totalStages ?? 5} этапов
            </span>
          </div>
        </HeaderStat>
      </div>

      <div className="home-header__actions">
        <button className="balance-button" type="button">
          <span aria-hidden="true">$</span>
          <strong>1 450</strong>
          <i aria-hidden="true">⌄</i>
        </button>
        <ProfileMenu email={email} />
        <button className="icon-button" type="button" aria-label="Уведомления">
          ♧
          <i className="icon-button__notification" />
        </button>
        <button className="icon-button" type="button" aria-label="Открыть меню">
          ☰
        </button>
      </div>
    </header>
  )
}

export default HomeHeader
