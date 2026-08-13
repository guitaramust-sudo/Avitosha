import type {
  ActionType,
  GameEvent,
  GameTask,
  PetCharacter,
  PetMood,
  RoomItemCode,
} from '../types/game'
import { isRoomItemCode } from '../types/game'

export const moodLabels: Record<PetMood, string> = {
  CALM: 'Спокоен',
  CURIOUS: 'Заинтересован',
  HAPPY: 'Рад',
  EXCITED: 'В восторге',
  PROUD: 'Гордится',
  SLEEPING: 'Отдыхает',
}

export const roomItemLabels: Record<RoomItemCode, string> = {
  BOX: 'Коробка',
  DESK: 'Стол',
  LAMP: 'Лампа',
  CHAIR: 'Кресло',
  PLANT: 'Растение',
  POSTER: 'Постер',
  PIGGY_BANK: 'Копилка',
  TOY_CAR: 'Игрушечная машина',
  SUITCASE: 'Чемодан',
}

export const taskActionLabels: Record<ActionType, string> = {
  AD_VIEWED: 'Посмотреть объявление',
  AD_FAVORITED: 'Добавить в избранное',
  MESSAGE_SENT: 'Написать продавцу',
  AD_CREATED: 'Разместить объявление',
  DELIVERY_USED: 'Использовать доставку',
  LISTING_IMPROVED: 'Улучшить объявление',
  LISTING_SOLD: 'Оформить покупку',
  REVIEW_LEFT: 'Оставить отзыв',
  BOOKING_CREATED: 'Создать бронирование',
}

export const taskStatusLabels: Record<GameTask['status'], string> = {
  ACTIVE: 'Текущее',
  COMPLETED: 'Выполнено',
  REWARDED: 'Награда получена',
  EXPIRED: 'Завершено',
}

const achievementNames: Record<string, string> = {
  EXPLORER: 'Исследователь',
  FIRST_AD: 'Первое объявление',
  FIRST_STEP: 'Первый шаг',
  HOUSEWARMING: 'Новоселье',
  IN_TOUCH: 'На связи',
  ROOM_COMPLETE: 'Комната готова',
}

const characterNames: Record<PetCharacter, string> = {
  ARCHITECT: 'Архитектор',
  CRAFTSPERSON: 'Мастер',
  ENTREPRENEUR: 'Предприниматель',
  EXPLORER: 'Исследователь',
  MECHANIC: 'Механик',
  TRAVELER: 'Путешественник',
}

export const getLevelXpFloor = (level: number) => {
  const floors: Record<number, number> = {
    1: 0,
    2: 100,
    3: 250,
    4: 450,
    5: 700,
  }

  return floors[level] ?? 0
}

const toDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatGameDate = (value: string) => {
  const date = toDate(value)

  return date
    ? new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }).format(date)
    : value
}

export const formatGameDateTime = (value: string) => {
  const date = toDate(value)

  return date
    ? new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
      }).format(date)
    : value
}

export const getGameEventMessage = (events: GameEvent[]) => {
  const messages: Array<{ priority: number; text: string }> = []
  const hasDetailedRewardMessage = events.some((event) =>
    [
      'TASK_COMPLETED',
      'DAILY_QUEST_COMPLETED',
      'DAILY_GOAL_COMPLETED',
    ].includes(event.type),
  )

  events.forEach((event) => {
    switch (event.type) {
      case 'STORY_COMPLETED':
        messages.push({ priority: 100, text: 'Первая комната готова!' })
        break
      case 'PET_LEVEL_UP':
        messages.push({
          priority: 90,
          text: `Новый уровень Авитоши: ${event.level}`,
        })
        break
      case 'ROOM_ITEM_UNLOCKED':
        messages.push({
          priority: 80,
          text: `Новый предмет: ${
            isRoomItemCode(event.itemCode)
              ? roomItemLabels[event.itemCode]
              : event.itemCode
          }`,
        })
        break
      case 'ACHIEVEMENT_UNLOCKED':
        messages.push({
          priority: 75,
          text: `Достижение: ${achievementNames[event.code] ?? event.code}`,
        })
        break
      case 'PET_CHARACTER_UNLOCKED':
        messages.push({
          priority: 75,
          text: `Характер открыт: ${characterNames[event.character]}`,
        })
        break
      case 'TASK_COMPLETED':
        messages.push({
          priority: 70,
          text: `Ты выполнил ${event.taskTitle ? `задание «${event.taskTitle}»` : 'задание'}! Ура! Теперь ты получил ${formatTaskReward(event.xpReward, event.avitoRewardAmount)}`,
        })
        break
      case 'REWARD_CATALOG_UNLOCKED':
        messages.push({
          priority: 85,
          text: `Открыта награда: ${event.title}`,
        })
        break
      case 'AVITO_REWARD_EARNED':
        if (hasDetailedRewardMessage) break
        messages.push({
          priority: 68,
          text: `Получено ${event.amount} Avito-бонусов`,
        })
        break
      case 'DAILY_QUEST_COMPLETED':
        messages.push({
          priority: 72,
          text: `Ты выполнил задание «${event.title}»! Ура! Теперь ты получил ${event.xpReward} XP`,
        })
        break
      case 'DAILY_GOAL_COMPLETED':
        messages.push({
          priority: 82,
          text: `Дневная цель выполнена: +${event.xpReward} XP`,
        })
        break
      case 'BALANCED_DAY_COMPLETED':
        messages.push({
          priority: 78,
          text: `Сбалансированный день: +${event.rewardAmount} Avito-бонуса`,
        })
        break
      case 'DAILY_QUEST_UPDATED':
        messages.push({
          priority: 35,
          text: `Задание дня: ${event.progress}/${event.target}`,
        })
        break
      case 'STREAK_UPDATED':
        messages.push({
          priority: 45,
          text: event.protectionEarned
            ? `Серия: ${event.current} дней · получен щит`
            : event.protectionUsed
              ? `Серия сохранена щитом: ${event.current} дней`
              : event.reset
                ? 'Серия дней началась заново'
                : `Серия: ${event.current} дней подряд`,
        })
        break
      case 'STORY_STAGE_COMPLETED':
        messages.push({
          priority: 65,
          text: `Этап истории ${event.stage} завершён`,
        })
        break
      case 'XP_EARNED':
        if (hasDetailedRewardMessage) break
        messages.push({ priority: 60, text: `Получено ${event.amount} XP` })
        break
      case 'PET_MOOD_CHANGED':
        messages.push({
          priority: 40,
          text: `Настроение: ${moodLabels[event.mood]}`,
        })
        break
      case 'TASK_PROGRESS_UPDATED':
        messages.push({
          priority: 30,
          text: `Прогресс задания: ${event.progress}/${event.target}`,
        })
        break
      case 'LEADERBOARD_SCORE_UPDATED':
        messages.push({
          priority: 20,
          text: `Рейтинг: ${event.delta >= 0 ? '+' : ''}${event.delta} очков`,
        })
        break
      case 'LISTING_FAVORITED':
        messages.push({
          priority: 12,
          text: 'Объявление добавлено в избранное',
        })
        break
      case 'SELLER_CONTACTED':
        messages.push({ priority: 12, text: 'Сообщение продавцу отправлено' })
        break
      case 'LISTING_PUBLISHED':
        messages.push({ priority: 12, text: 'Объявление опубликовано' })
        break
      case 'LISTING_IMPROVED':
        messages.push({ priority: 12, text: 'Качество объявления улучшено' })
        break
      case 'LISTING_SOLD':
        messages.push({ priority: 12, text: 'Покупка оформлена' })
        break
      case 'DELIVERY_USED':
        messages.push({ priority: 12, text: 'Авито Доставка подключена' })
        break
    }
  })

  const uniqueMessages = [
    ...new Set(
      messages
        .sort((left, right) => right.priority - left.priority)
        .map(({ text }) => text),
    ),
  ]

  return uniqueMessages.slice(0, 3).join(' · ') || 'Прогресс Авитоши обновлён'
}

const formatTaskReward = (xpReward?: number, avitoRewardAmount?: number) => {
  const rewards: string[] = []
  if (xpReward) rewards.push(`${xpReward} XP`)
  if (avitoRewardAmount) {
    rewards.push(`${avitoRewardAmount} Avito-бонусов`)
  }
  return rewards.join(' и ') || 'награду'
}

const productOnlyEventTypes = new Set<GameEvent['type']>([
  'LISTING_VIEWED',
  'LISTING_FAVORITED',
  'SELLER_CONTACTED',
  'LISTING_PUBLISHED',
  'LISTING_IMPROVED',
  'LISTING_SOLD',
  'DELIVERY_USED',
])

export const hasNotifiableGameEvent = (events: GameEvent[]) =>
  events.some((event) => !productOnlyEventTypes.has(event.type))
