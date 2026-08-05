import type {
  Achievement,
  ActionRequest,
  ActionResult,
  DailySummary,
  GameTask,
  LeaderboardResponse,
  PetProfile,
  RoomResponse,
  StoryResponse,
} from '../types/game'
import { apiRequest } from './client'

const authorized = (accessToken: string): RequestInit => ({
  headers: { Authorization: `Bearer ${accessToken}` },
})

export const getPet = (accessToken: string) =>
  apiRequest<PetProfile>('/api/v1/pet', authorized(accessToken))

export const getTasks = async (accessToken: string) => {
  const response = await apiRequest<{ tasks: GameTask[] }>(
    '/api/v1/tasks',
    authorized(accessToken),
  )
  return response.tasks
}

export const getRoom = (accessToken: string) =>
  apiRequest<RoomResponse>('/api/v1/room', authorized(accessToken))

export const getStory = (accessToken: string) =>
  apiRequest<StoryResponse>('/api/v1/story', authorized(accessToken))

export const getDailySummary = (accessToken: string) =>
  apiRequest<DailySummary>('/api/v1/daily-summary', authorized(accessToken))

export const getLeaderboard = (accessToken: string) =>
  apiRequest<LeaderboardResponse>(
    '/api/v1/leaderboard?period=weekly&limit=10',
    authorized(accessToken),
  )

export const getAchievements = async (accessToken: string) => {
  const response = await apiRequest<{ achievements: Achievement[] }>(
    '/api/v1/achievements',
    authorized(accessToken),
  )
  return response.achievements
}

export const postAction = (accessToken: string, action: ActionRequest) =>
  apiRequest<ActionResult>('/api/v1/actions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(action),
  })
