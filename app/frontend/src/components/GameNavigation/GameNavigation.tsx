import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { useAppSelector } from '../../hooks/redux'
import {
  selectGamePet,
  selectGameRoom,
  selectGameWallet,
} from '../../store/gameSlice'
import { getLevelXpFloor, moodLabels } from '../../utils/gamePresentation'
import { iconAssets } from '../../utils/iconAssets'
import PetRenameDialog from '../PetRenameDialog/PetRenameDialog'
import ProfileMenu from '../ProfileMenu/ProfileMenu'

import './GameNavigation.scss'

const navigation = [
  { end: true, icon: '⌂', label: 'Дом', to: '/' },
  { end: false, icon: '↗', label: 'Прогресс', to: '/progress' },
  { end: false, icon: '◇', label: 'Награды', to: '/rewards' },
  { end: false, icon: '☆', label: 'Достижения', to: '/achievements' },
  { end: false, icon: '♛', label: 'Лидерборд', to: '/leaderboard' },
  { end: false, icon: '▦', label: 'Объявления', to: '/marketplace' },
] as const

function GameNavigation() {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const email = useAppSelector((state) => state.auth.user?.email)
  const pet = useAppSelector(selectGamePet)
  const room = useAppSelector(selectGameRoom)
  const wallet = useAppSelector(selectGameWallet)
  const levelFloor = pet ? getLevelXpFloor(pet.level) : 0
  const levelTarget = pet?.nextLevelXp ?? pet?.growthXp ?? 1
  const levelProgress = pet?.nextLevelXp
    ? Math.min(
        100,
        ((pet.growthXp - levelFloor) / (levelTarget - levelFloor)) * 100,
      )
    : 100

  return (
    <>
      <aside className="game-navigation">
        <div className="game-navigation__brand">
          <img src={iconAssets.avitoLogo} alt="" />
          <span>Авитоша</span>
        </div>

        <section className="game-navigation__pet">
          <button type="button" onClick={() => setIsRenameOpen(true)}>
            <span>{pet?.name.slice(0, 1) ?? 'А'}</span>
            <span>
              <strong>{pet?.name ?? 'Авитоша'}</strong>
              <small>
                {pet ? moodLabels[pet.mood] : 'Загрузка'} · ур.{' '}
                {pet?.level ?? 1}
              </small>
            </span>
            <i aria-hidden="true">✎</i>
          </button>
          <div className="game-navigation__level">
            <span>
              <b>{pet?.growthXp ?? 0} XP</b>
              <small>
                {pet?.nextLevelXp ? `до ${pet.nextLevelXp}` : 'максимум'}
              </small>
            </span>
            <span aria-hidden="true">
              <i style={{ width: `${levelProgress}%` }} />
            </span>
          </div>
        </section>

        <nav aria-label="Игровые разделы">
          {navigation.map(({ end, icon, label, to }) => (
            <NavLink key={to} end={end} to={to}>
              <span aria-hidden="true">{icon}</span>
              <strong>{label}</strong>
            </NavLink>
          ))}
        </nav>

        <section className="game-navigation__summary">
          <div>
            <span>Бонусы</span>
            <strong>{wallet?.balance.balance ?? 0}</strong>
          </div>
          <div>
            <span>Комната</span>
            <strong>{room?.progress ?? '0/6'}</strong>
          </div>
        </section>
        <div className="game-navigation__profile">
          <span>
            <small>Профиль</small>
            <strong>{email ?? 'Пользователь'}</strong>
          </span>
          <ProfileMenu email={email} />
        </div>
      </aside>

      <header className="game-mobile-header">
        <NavLink className="game-mobile-header__brand" to="/">
          <img src={iconAssets.avitoLogo} alt="" />
          <strong>Авитоша</strong>
        </NavLink>
        <span className="game-mobile-header__balance">
          <img src={iconAssets.coin} alt="" />
          {wallet?.balance.balance ?? 0}
        </span>
        <ProfileMenu email={email} />
      </header>

      <nav className="game-mobile-navigation" aria-label="Игровые разделы">
        {navigation.map(({ end, icon, label, to }) => (
          <NavLink key={to} end={end} to={to}>
            <span aria-hidden="true">{icon}</span>
            <small>{label}</small>
          </NavLink>
        ))}
      </nav>

      {isRenameOpen && pet && (
        <PetRenameDialog
          currentName={pet.name}
          onClose={() => setIsRenameOpen(false)}
        />
      )}
    </>
  )
}

export default GameNavigation
