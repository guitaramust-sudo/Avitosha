import avitoLogo from '../../images/icons/avito_logo.png'
import coin from '../../images/icons/coin.png'
import crown from '../../images/icons/crown.png'
import fire from '../../images/icons/fire.png'
import lock from '../../images/icons/lock.png'
import magnifier from '../../images/icons/magnifier.png'
import smile from '../../images/icons/smile.png'
import star from '../../images/icons/star.png'
import sun from '../../images/icons/sun.png'
import target from '../../images/icons/target.png'
import wallet from '../../images/icons/wallet.png'

export const iconAssets = {
  avitoLogo,
  coin,
  crown,
  fire,
  lock,
  magnifier,
  smile,
  star,
  sun,
  target,
  wallet,
} as const

export const achievementIconAssets: Record<string, string> = {
  'achievement.explorer': magnifier,
  'achievement.first_ad': star,
  'achievement.first_step': star,
  'achievement.housewarming': target,
  'achievement.in_touch': smile,
  'achievement.room_complete': crown,
}

export const characterIconAssets: Record<string, string> = {
  'character.explorer': magnifier,
}
