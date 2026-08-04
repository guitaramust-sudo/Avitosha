import AchievementsPanel from '../components/AchievementsPanel/AchievementsPanel'
import HomeHeader from '../components/HomeHeader/HomeHeader'
import RoomCollection from '../components/RoomCollection/RoomCollection'
import RoomStage from '../components/RoomStage/RoomStage'

import './HomePage.scss'

function HomePage() {
  return (
    <main className="home-page">
      <div className="home-page__shell">
        <HomeHeader />

        <div className="home-dashboard">
          <AchievementsPanel />

          <div className="home-dashboard__content">
            <RoomStage />
            <RoomCollection />
          </div>
        </div>
      </div>
    </main>
  )
}

export default HomePage
