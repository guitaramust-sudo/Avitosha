import { type ReactNode, useState } from 'react'

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

import './HomeHeader.scss'

interface HeaderStatProps {
  iconSrc: string
  label: string
  tone: 'blue' | 'green' | 'purple'
  children: ReactNode
}

function HeaderStat({ iconSrc, label, tone, children }: HeaderStatProps) {
  return (
    <section className="header-stat">
      <span className={`header-stat__icon header-stat__icon--${tone}`}>
        <img src={iconSrc} alt="" />
      </span>
      <div className="header-stat__content">
        <span className="header-stat__label">{label}</span>
        {children}
      </div>
    </section>
  )
}

function BrandMark() {
  return <img className="brand-mark" src={iconAssets.avitoLogo} alt="" />
}

function HomeHeader() {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const email = useAppSelector((state) => state.auth.user?.email)
  const pet = useAppSelector(selectGamePet)
  const room = useAppSelector(selectGameRoom)
  const wallet = useAppSelector(selectGameWallet)
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
    <>
      <header className="home-header">
        <div className="home-header__brand">
          <BrandMark />
          <button
            className="home-header__pet-name"
            type="button"
            aria-label="Изменить имя питомца"
            onClick={() => setIsRenameOpen(true)}
            disabled={!pet}
          >
            <span>{pet?.name ?? 'Авитоша'}</span>
            <i aria-hidden="true">✎</i>
          </button>
        </div>

        <div className="home-header__stats">
          <HeaderStat
            iconSrc={iconAssets.star}
            label={`Уровень ${pet?.level ?? 1}`}
            tone="purple"
          >
            <div
              className="level-progress"
              aria-label={`${pet?.growthXp ?? 0} опыта`}
            >
              <span className="level-progress__track">
                <i style={{ width: `${levelProgress}%` }} />
              </span>
              <span>
                <strong>{pet?.growthXp ?? 0}</strong>
                {pet?.nextLevelXp
                  ? ` / ${pet.nextLevelXp} XP`
                  : ' XP · максимум'}
              </span>
            </div>
          </HeaderStat>

          <HeaderStat
            iconSrc={iconAssets.smile}
            label="Настроение"
            tone="green"
          >
            <strong className="header-stat__value header-stat__value--green">
              {pet ? moodLabels[pet.mood] : 'Загрузка…'}
            </strong>
          </HeaderStat>

          <HeaderStat iconSrc={iconAssets.target} label="Цель" tone="blue">
            <div className="goal-progress">
              <strong>
                Обустроить
                <br />
                комнату
              </strong>
              <span>{room?.progress ?? '0/6'} предметов</span>
            </div>
          </HeaderStat>
        </div>

        <div className="home-header__actions">
          <span className="reward-balance" title="Баланс Avito-бонусов">
            <img src={iconAssets.coin} alt="" />
            {wallet?.balance.balance ?? 0}
          </span>
          <ProfileMenu email={email} />
        </div>
      </header>

      {isRenameOpen && pet && (
        <PetRenameDialog
          currentName={pet.name}
          onClose={() => setIsRenameOpen(false)}
        />
      )}
    </>
  )
}

export default HomeHeader
