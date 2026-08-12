import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import RewardWallet from '../../components/RewardWallet/RewardWallet'

import '../game-pages.scss'

function RewardsPage() {
  return (
    <section className="game-section-page">
      <GamePageHeader
        eyebrow="Практическая польза"
        title="Награды"
        description="Собирайте Avito-бонусы и открывайте преимущества каталога за полезные действия."
      />
      <div
        className="game-section-page__cards game-section-page__cards--single"
        data-page="rewards"
      >
        <RewardWallet />
      </div>
    </section>
  )
}

export default RewardsPage
