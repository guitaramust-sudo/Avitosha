import { useAppSelector } from '../../hooks/redux'
import { selectGameWallet } from '../../store/gameSlice'
import { iconAssets } from '../../utils/iconAssets'
import CollapsibleSection from '../CollapsibleSection/CollapsibleSection'

import './RewardWallet.scss'

const progressPercent = (current: number, target: number) =>
  target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0

function RewardWallet() {
  const wallet = useAppSelector(selectGameWallet)

  if (!wallet) return null

  return (
    <CollapsibleSection
      className="progress-card reward-wallet-card"
      title="Кошелёк наград"
      tourId="wallet"
    >
      <span
        className="progress-card__icon reward-wallet-card__icon"
        aria-hidden="true"
      >
        <img src={iconAssets.wallet} alt="" />
      </span>
      <div className="reward-wallet-card__content">
        <small>Кошелёк наград</small>
        <div className="reward-wallet-card__balance">
          <h2>{wallet.balance.balance} бонусов</h2>
          <span>Получено за всё время: {wallet.balance.earnedTotal}</span>
        </div>

        {wallet.nextGoal ? (
          <div className="reward-wallet-card__goal">
            <div>
              <strong>{wallet.nextGoal.title}</strong>
              <span>Осталось {wallet.nextGoal.remaining}</span>
            </div>
            <span
              className="reward-progress"
              role="progressbar"
              aria-label={`Прогресс до награды ${wallet.nextGoal.title}`}
              aria-valuemin={0}
              aria-valuemax={wallet.nextGoal.target}
              aria-valuenow={wallet.nextGoal.current}
            >
              <i
                style={{
                  width: `${progressPercent(wallet.nextGoal.current, wallet.nextGoal.target)}%`,
                }}
              />
            </span>
          </div>
        ) : (
          <strong className="reward-wallet-card__complete">
            Все награды каталога открыты
          </strong>
        )}

        <ul className="reward-wallet-card__catalog" aria-label="Каталог наград">
          {wallet.catalog.map((reward) => (
            <li
              key={reward.code}
              className={reward.unlocked ? 'is-unlocked' : ''}
            >
              <span aria-hidden="true">
                {reward.unlocked ? (
                  '✓'
                ) : (
                  <img
                    className="reward-wallet-card__lock"
                    src={iconAssets.lock}
                    alt=""
                  />
                )}
              </span>
              <div>
                <strong>{reward.title}</strong>
                <small>{reward.description}</small>
              </div>
              <b>
                {reward.unlocked ? 'Открыто' : `${reward.remaining} до награды`}
              </b>
            </li>
          ))}
        </ul>
      </div>
    </CollapsibleSection>
  )
}

export default RewardWallet
