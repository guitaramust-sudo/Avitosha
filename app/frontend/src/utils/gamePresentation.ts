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
  REVIEW_LEFT: 'Оставить отзыв',
  BOOKING_CREATED: 'Создать бронирование',
}

export const taskStatusLabels: Record<GameTask['status'], string> = {
  ACTIVE: 'Текущее',
  COMPLETED: 'Выполнено',
  REWARDED: 'Награда получена',
  EXPIRED: 'Завершено',
}

export const achievementIcons: Record<string, string> = {
  'achievement.explorer': '⌕',
  'achievement.first_ad': '▤',
  'achievement.first_step': '★',
  'achievement.housewarming': '⌂',
  'achievement.in_touch': '●',
  'achievement.room_complete': '✓',
}

export const characterIcons: Record<string, string> = {
  'character.architect': '⌂',
  'character.craftsperson': '◇',
  'character.entrepreneur': '↗',
  'character.explorer': '⌕',
  'character.mechanic': '⚙',
  'character.traveler': '⌁',
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
        messages.push({ priority: 70, text: 'Задание выполнено' })
        break
      case 'REWARD_CATALOG_UNLOCKED':
        messages.push({
          priority: 85,
          text: `Открыта награда: ${event.title}`,
        })
        break
      case 'AVITO_REWARD_EARNED':
        messages.push({
          priority: 68,
          text: `Получено ${event.amount} Avito-бонусов`,
        })
        break
      case 'DAILY_QUEST_COMPLETED':
        messages.push({
          priority: 72,
          text: `Ежедневное задание выполнено: ${event.title}`,
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
          text: event.reset
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
