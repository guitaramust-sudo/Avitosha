import {
  type Achievement,
  type ActionRequest,
  type ActionResult,
  type DailySummary,
  type GameTask,
  isAchievementCode,
  isGameTaskCode,
  isRoomItemCode,
  type LeaderboardResponse,
  type PetProfile,
  type RewardWallet,
  type RoomItem,
  type RoomResponse,
  type StoryResponse,
  type TaskAdvice,
} from '../types/game'
import { apiRequest } from './client'

const authorized = (accessToken: string): RequestInit => ({
  headers: { Authorization: `Bearer ${accessToken}` },
})

type DailySummaryResponse = Omit<DailySummary, 'unlockedRoomItems'> & {
  unlockedRoomItems?: string[] | null
}

type RawGameTask = Omit<GameTask, 'code' | 'roomItemCode'> & {
  code: string
  roomItemCode: string | null
}

const normalizeTask = (task: RawGameTask): GameTask | null => {
  if (!isGameTaskCode(task.code)) {
    return null
  }

  return {
    ...task,
    code: task.code,
    roomItemCode:
      task.roomItemCode && isRoomItemCode(task.roomItemCode)
        ? task.roomItemCode
        : null,
  }
}

export const getPet = (accessToken: string) =>
  apiRequest<PetProfile>('/api/v1/pet', authorized(accessToken))

export const renamePet = (accessToken: string, name: string) =>
  apiRequest<PetProfile>('/api/v1/pet', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  })

export const getTasks = async (accessToken: string) => {
  const response = await apiRequest<{ tasks: RawGameTask[] | null }>(
    '/api/v1/tasks',
    authorized(accessToken),
  )
  return (response.tasks ?? []).flatMap((task) => {
    const normalizedTask = normalizeTask(task)
    return normalizedTask ? [normalizedTask] : []
  })
}

export const getTask = async (accessToken: string, taskId: string) => {
  const task = await apiRequest<RawGameTask>(
    `/api/v1/tasks/${encodeURIComponent(taskId)}`,
    authorized(accessToken),
  )

  const normalizedTask = normalizeTask(task)
  if (!normalizedTask) {
    throw new Error('Backend returned an unsupported task code.')
  }

  return normalizedTask
}

export const getTaskAdvice = (accessToken: string, taskId: string) =>
  apiRequest<TaskAdvice>(
    `/api/v1/tasks/${encodeURIComponent(taskId)}/advice`,
    authorized(accessToken),
  )

export const getRoom = async (accessToken: string): Promise<RoomResponse> => {
  type RawRoomItem = Omit<RoomItem, 'code' | 'unlockTaskCode'> & {
    code: string
    unlockTaskCode: string | null
  }
  const response = await apiRequest<
    Omit<RoomResponse, 'items'> & { items: RawRoomItem[] | null }
  >('/api/v1/room', authorized(accessToken))

  const items = (response.items ?? []).flatMap((item) => {
    if (!isRoomItemCode(item.code)) {
      return []
    }

    return [
      {
        ...item,
        code: item.code,
        unlockTaskCode:
          item.unlockTaskCode && isGameTaskCode(item.unlockTaskCode)
            ? item.unlockTaskCode
            : null,
      },
    ]
  })

  return { ...response, items }
}

export const getStory = (accessToken: string) =>
  apiRequest<StoryResponse>('/api/v1/story', authorized(accessToken))

export const getDailySummary = async (
  accessToken: string,
): Promise<DailySummary> => {
  const response = await apiRequest<DailySummaryResponse>(
    '/api/v1/daily-summary',
    authorized(accessToken),
  )

  return {
    ...response,
    unlockedRoomItems: response.unlockedRoomItems ?? [],
  }
}

export const getRewardWallet = async (
  accessToken: string,
): Promise<RewardWallet> => {
  const response = await apiRequest<
    Omit<RewardWallet, 'catalog'> & {
      catalog: RewardWallet['catalog'] | null
    }
  >('/api/v1/rewards/wallet', authorized(accessToken))

  return { ...response, catalog: response.catalog ?? [] }
}

export const getLeaderboard = async (
  accessToken: string,
): Promise<LeaderboardResponse> => {
  const response = await apiRequest<
    Omit<LeaderboardResponse, 'leaders'> & {
      leaders: LeaderboardResponse['leaders'] | null
    }
  >('/api/v1/leaderboard?period=weekly&limit=10', authorized(accessToken))

  return { ...response, leaders: response.leaders ?? [] }
}

export const getAchievements = async (accessToken: string) => {
  type RawAchievement = Omit<Achievement, 'code'> & { code: string }
  const response = await apiRequest<{
    achievements: RawAchievement[] | null
  }>('/api/v1/achievements', authorized(accessToken))
  return (response.achievements ?? []).flatMap((achievement) =>
    isAchievementCode(achievement.code)
      ? [{ ...achievement, code: achievement.code }]
      : [],
  )
}

export const postAction = async (
  accessToken: string,
  action: ActionRequest,
): Promise<ActionResult> => {
  const response = await apiRequest<
    Omit<ActionResult, 'events'> & { events: ActionResult['events'] | null }
  >('/api/v1/actions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(action),
  })

  return { ...response, events: response.events ?? [] }
}
