import GamePageHeader from '../../components/GamePageHeader/GamePageHeader'
import RetentionPanel from '../../components/RetentionPanel/RetentionPanel'
import RewardWallet from '../../components/RewardWallet/RewardWallet'

import '../game-pages.scss'

function RewardsPage() {
  return (
    <section className="game-section-page">
      <GamePageHeader
        eyebrow="Практическая польза"
        title="Награды"
        description="Собирайте Avito-бонусы, открывайте преимущества каталога и поддерживайте ежедневную серию."
      />
      <div className="game-section-page__cards" data-page="rewards">
        <RewardWallet />
        <RetentionPanel />
      </div>
    </section>
  )
}

export default RewardsPage
