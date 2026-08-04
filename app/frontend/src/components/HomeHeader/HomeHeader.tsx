import type { ReactNode } from 'react'

import { useAppSelector } from '../../hooks/redux'
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

  return (
    <header className="home-header">
      <div className="home-header__brand">
        <BrandMark />
        <span>Авитоша</span>
      </div>

      <div className="home-header__stats">
        <HeaderStat icon="★" label="Уровень 8" tone="purple">
          <div className="level-progress" aria-label="1250 из 2000 опыта">
            <span className="level-progress__track">
              <i />
            </span>
            <span>
              <strong>1 250</strong> / 2 000 XP
            </span>
          </div>
        </HeaderStat>

        <HeaderStat icon="☺" label="Настроение" tone="green">
          <strong className="header-stat__value header-stat__value--green">
            Отличное!
          </strong>
        </HeaderStat>

        <HeaderStat icon="◎" label="Цель" tone="blue">
          <div className="goal-progress">
            <strong>Обустроить комнату</strong>
            <span>4 / 8 предметов</span>
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
