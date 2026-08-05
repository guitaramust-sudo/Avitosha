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
    code: string
    title: string
    currentStage: number
    totalStages: number
    status: 'ACTIVE' | 'COMPLETED'
  }
}

export interface GameTask {
  id: string
  code: string
  title: string
  description: string
  petPhrase: string
  actionType: ActionType
  category: string | null
  progress: number
  target: number
  status: 'ACTIVE' | 'COMPLETED' | 'REWARDED' | 'EXPIRED'
  xpReward: number
  roomItemCode: string | null
  avitoRewardType: string | null
  avitoRewardAmount: number
  storyStage: number | null
}

export interface RoomItem {
  code: string
  name: string
  description: string
  status: 'LOCKED' | 'UNLOCKED' | 'PLACED'
  assetKey: string
  positionKey: string
  unlockTaskCode: string | null
}

export interface RoomResponse {
  storyCode: string
  progress: string
  items: RoomItem[]
}

export interface StoryResponse {
  code: string
  title: string
  description: string
  currentStage: number
  totalStages: number
  status: 'ACTIVE' | 'COMPLETED'
  nextTask: {
    id: string
    code: string
    title: string
    roomItemCode: string | null
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
  code: string
  title: string
  description: string
  iconKey: string
  unlocked: boolean
  unlockedAt: string | null
}

export interface GameEvent {
  id: string
  type: string
  occurredAt: string
  [key: string]: unknown
}

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
