export type PetMood =
  'CALM' | 'CURIOUS' | 'HAPPY' | 'EXCITED' | 'PROUD' | 'SLEEPING'

export type PetCharacter =
  | 'EXPLORER'
  | 'ENTREPRENEUR'
  | 'MECHANIC'
  | 'TRAVELER'
  | 'ARCHITECT'
  | 'CRAFTSPERSON'

export type ActionType =
  | 'AD_VIEWED'
  | 'AD_FAVORITED'
  | 'MESSAGE_SENT'
  | 'AD_CREATED'
  | 'DELIVERY_USED'
  | 'REVIEW_LEFT'
  | 'BOOKING_CREATED'

export const gameTaskCodes = [
  'VIEW_FURNITURE_ADS',
  'FAVORITE_FURNITURE_AD',
  'MESSAGE_SELLER',
  'CREATE_FIRST_AD',
  'USE_DELIVERY',
] as const

export type GameTaskCode = (typeof gameTaskCodes)[number]

export const isGameTaskCode = (value: string): value is GameTaskCode =>
  gameTaskCodes.some((code) => code === value)

export const achievementCodes = [
  'FIRST_STEP',
  'HOUSEWARMING',
  'EXPLORER',
  'IN_TOUCH',
  'FIRST_AD',
  'ROOM_COMPLETE',
] as const

export type AchievementCode = (typeof achievementCodes)[number]

export const isAchievementCode = (value: string): value is AchievementCode =>
  achievementCodes.some((code) => code === value)

export type StoryCode = 'FIRST_ROOM'

export const roomItemCodes = [
  'BOX',
  'DESK',
  'LAMP',
  'CHAIR',
  'PLANT',
  'POSTER',
  'PIGGY_BANK',
  'TOY_CAR',
  'SUITCASE',
] as const

export type RoomItemCode = (typeof roomItemCodes)[number]

export const isRoomItemCode = (value: string): value is RoomItemCode =>
  roomItemCodes.some((code) => code === value)

export interface CharacterProfile {
  code: PetCharacter
  name: string
  description: string
  iconKey: string
  visualDetail: string
  progress: number
  target: number
  unlocked: boolean
}

export interface PetProfile {
  id: string
  name: string
  level: number
  growthXp: number
  nextLevelXp: number | null
  mood: PetMood
  character: PetCharacter | null
  characterProfile: CharacterProfile
  currentStory: {
    code: StoryCode
    title: string
    currentStage: number
    totalStages: number
    status: 'ACTIVE' | 'COMPLETED'
  }
}

export interface GameTask {
  id: string
  code: GameTaskCode
  title: string
  description: string
  petPhrase: string
  actionType: ActionType
  category: string | null
  progress: number
  target: number
  status: 'ACTIVE' | 'COMPLETED' | 'REWARDED' | 'EXPIRED'
  xpReward: number
  roomItemCode: RoomItemCode | null
  avitoRewardType: string | null
  avitoRewardAmount: number
  storyStage: number | null
}

export interface RoomItem {
  code: RoomItemCode
  name: string
  description: string
  status: 'LOCKED' | 'UNLOCKED' | 'PLACED'
  assetKey: string
  positionKey: string
  unlockTaskCode: GameTaskCode | null
}

export interface RoomResponse {
  storyCode: StoryCode
  progress: string
  items: RoomItem[]
}

export interface StoryResponse {
  code: StoryCode
  title: string
  description: string
  currentStage: number
  totalStages: number
  status: 'ACTIVE' | 'COMPLETED'
  nextTask: {
    id: string
    code: GameTaskCode
    title: string
    roomItemCode: RoomItemCode | null
  } | null
}

export interface DailySummary {
  date: string
  actionsCount: number
  completedTasks: number
  earnedXp: number
  levelBefore: number
  levelAfter: number
  unlockedRoomItems: string[]
  storyStageBefore: number
  storyStageAfter: number
  weeklyScoreDelta: number
  weeklyPosition: number | null
  petMood: PetMood
  retention: RetentionOverview
}

export type RewardSource = 'TASK_COMPLETION' | 'DAILY_QUEST' | 'STREAK'

export interface RewardOffer {
  type: string
  amount: number
  source: RewardSource
}

export interface RewardGoal {
  code: string
  title: string
  rewardType: string
  perkType: string
  current: number
  target: number
  remaining: number
}

export interface DailyQuest {
  date: string
  code: string
  title: string
  description: string
  actionType: ActionType
  category: string | null
  progress: number
  target: number
  status: 'ACTIVE' | 'COMPLETED' | 'REWARDED' | 'EXPIRED'
  reward: RewardOffer
}

export interface TomorrowDailyQuest {
  code: string
  title: string
  description: string
  actionType: ActionType
  category: string | null
  target: number
  reward: RewardOffer
}

export interface RetentionOverview {
  streak: {
    current: number
    longest: number
    lastActiveDate: string | null
    activeToday: boolean
    reward: RewardOffer
  }
  dailyQuest: DailyQuest
  tomorrow: {
    date: string
    streakAfterReturn: number
    streakReward: RewardOffer
    dailyQuest: TomorrowDailyQuest
    nextGoal: RewardGoal | null
  }
}

export interface RewardBalance {
  type: string
  balance: number
  earnedTotal: number
  updatedAt: string
}

export interface RewardCatalogEntry {
  code: string
  title: string
  description: string
  rewardType: string
  perkType: string
  threshold: number
  unlocked: boolean
  progressCurrent: number
  progressTarget: number
  remaining: number
}

export interface RewardWallet {
  balance: RewardBalance
  catalog: RewardCatalogEntry[]
  nextGoal: RewardGoal | null
}

export interface LeaderboardEntry {
  position: number
  userId: string
  petName: string
  level: number
  score: number
  completedTasks: number
}

export interface LeaderboardResponse {
  weekStart: string
  leaders: LeaderboardEntry[]
  currentUser: LeaderboardEntry
}

export interface Achievement {
  code: AchievementCode
  title: string
  description: string
  iconKey: string
  unlocked: boolean
  unlockedAt: string | null
}

export type GameEventType =
  | 'TASK_PROGRESS_UPDATED'
  | 'TASK_COMPLETED'
  | 'XP_EARNED'
  | 'PET_LEVEL_UP'
  | 'PET_MOOD_CHANGED'
  | 'ROOM_ITEM_UNLOCKED'
  | 'STORY_STAGE_COMPLETED'
  | 'STORY_COMPLETED'
  | 'LEADERBOARD_SCORE_UPDATED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'PET_CHARACTER_UNLOCKED'
  | 'AVITO_REWARD_EARNED'
  | 'REWARD_CATALOG_UNLOCKED'
  | 'DAILY_QUEST_UPDATED'
  | 'DAILY_QUEST_COMPLETED'
  | 'STREAK_UPDATED'

interface GameEventBase<TType extends GameEventType> {
  id: string
  type: TType
  occurredAt: string
}

export type GameEvent =
  | (GameEventBase<'TASK_PROGRESS_UPDATED'> & {
      taskId: string
      taskCode: GameTaskCode
      progress: number
      target: number
    })
  | (GameEventBase<'TASK_COMPLETED'> & {
      taskId: string
      taskCode: GameTaskCode
    })
  | (GameEventBase<'XP_EARNED'> & { amount: number; totalXp: number })
  | (GameEventBase<'PET_LEVEL_UP'> & {
      previousLevel: number
      level: number
    })
  | (GameEventBase<'PET_MOOD_CHANGED'> & {
      previousMood: PetMood
      mood: PetMood
    })
  | (GameEventBase<'ROOM_ITEM_UNLOCKED'> & { itemCode: string })
  | (GameEventBase<'STORY_STAGE_COMPLETED'> & {
      storyCode: string
      stage: number
    })
  | (GameEventBase<'STORY_COMPLETED'> & { storyCode: string })
  | (GameEventBase<'LEADERBOARD_SCORE_UPDATED'> & {
      score: number
      delta: number
    })
  | (GameEventBase<'ACHIEVEMENT_UNLOCKED'> & { code: AchievementCode })
  | (GameEventBase<'PET_CHARACTER_UNLOCKED'> & {
      character: PetCharacter
    })
  | (GameEventBase<'AVITO_REWARD_EARNED'> & {
      rewardType: string
      amount: number
      balance: number
      earnedTotal: number
      sourceKind: RewardSource
      sourceRef: string
      sourceTitle?: string
      nextGoal?: Pick<
        RewardGoal,
        'code' | 'title' | 'current' | 'target' | 'remaining'
      >
      catalogUnlocks?: Array<
        Pick<RewardCatalogEntry, 'code' | 'title' | 'perkType' | 'threshold'>
      >
    })
  | (GameEventBase<'REWARD_CATALOG_UNLOCKED'> & {
      code: string
      title: string
      perkType: string
      threshold: number
    })
  | (GameEventBase<'DAILY_QUEST_UPDATED'> & {
      code: string
      title: string
      progress: number
      target: number
      status: DailyQuest['status']
      reward: Pick<RewardOffer, 'type' | 'amount'>
    })
  | (GameEventBase<'DAILY_QUEST_COMPLETED'> & {
      code: string
      title: string
      rewardType: string
      rewardAmount: number
    })
  | (GameEventBase<'STREAK_UPDATED'> & {
      current: number
      longest: number
      lastActiveDate: string
      reset: boolean
      reward: Pick<RewardOffer, 'type' | 'amount'>
    })

export interface ActionResult {
  actionId: string
  duplicate: boolean
  events: GameEvent[]
}

export interface ActionRequest {
  eventId: string
  type: ActionType
  entityId?: string
  category?: string
  occurredAt: string
  metadata: Record<string, unknown>
}
