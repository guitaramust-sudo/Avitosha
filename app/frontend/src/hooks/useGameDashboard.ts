import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  getAchievements,
  getDailySummary,
  getLeaderboard,
  getPet,
  getRewardWallet,
  getRoom,
  getStory,
  getTask,
  getTaskAdvice,
  getTasks,
  postAction,
} from '../api/game'
import type { ActionRequest, GameEvent } from '../types/game'

export const gameQueryKey = (userId?: string) =>
  userId ? (['game', userId] as const) : (['game'] as const)

export const gameQueryKeys = {
  advice: (userId: string) => [...gameQueryKey(userId), 'advice'] as const,
  achievements: (userId: string) =>
    [...gameQueryKey(userId), 'achievements'] as const,
  daily: (userId: string) =>
    [...gameQueryKey(userId), 'daily-summary'] as const,
  leaderboard: (userId: string) =>
    [...gameQueryKey(userId), 'leaderboard'] as const,
  pet: (userId: string) => [...gameQueryKey(userId), 'pet'] as const,
  wallet: (userId: string) =>
    [...gameQueryKey(userId), 'reward-wallet'] as const,
  room: (userId: string) => [...gameQueryKey(userId), 'room'] as const,
  story: (userId: string) => [...gameQueryKey(userId), 'story'] as const,
  tasks: (userId: string) => [...gameQueryKey(userId), 'tasks'] as const,
}

export const useGameDashboard = (
  accessToken: string | null,
  userId: string | undefined,
) => {
  const enabled = Boolean(accessToken && userId)
  const token = accessToken ?? ''
  const queryOwnerId = userId ?? ''

  const pet = useQuery({
    queryKey: gameQueryKeys.pet(queryOwnerId),
    queryFn: () => getPet(token),
    enabled,
  })
  const tasks = useQuery({
    queryKey: gameQueryKeys.tasks(queryOwnerId),
    queryFn: () => getTasks(token),
    enabled,
  })
  const room = useQuery({
    queryKey: gameQueryKeys.room(queryOwnerId),
    queryFn: () => getRoom(token),
    enabled,
  })
  const story = useQuery({
    queryKey: gameQueryKeys.story(queryOwnerId),
    queryFn: () => getStory(token),
    enabled,
  })
  const daily = useQuery({
    queryKey: gameQueryKeys.daily(queryOwnerId),
    queryFn: () => getDailySummary(token),
    enabled,
  })
  const leaderboard = useQuery({
    queryKey: gameQueryKeys.leaderboard(queryOwnerId),
    queryFn: () => getLeaderboard(token),
    enabled,
  })
  const achievements = useQuery({
    queryKey: gameQueryKeys.achievements(queryOwnerId),
    queryFn: () => getAchievements(token),
    enabled,
  })
  const wallet = useQuery({
    queryKey: gameQueryKeys.wallet(queryOwnerId),
    queryFn: () => getRewardWallet(token),
    enabled,
  })

  return {
    pet,
    tasks,
    room,
    story,
    daily,
    leaderboard,
    achievements,
    wallet,
  }
}

export type GameDashboardQueries = ReturnType<typeof useGameDashboard>

export const useGameTask = (
  accessToken: string | null,
  userId: string | undefined,
  taskId: string | null,
) =>
  useQuery({
    queryKey: [...gameQueryKeys.tasks(userId ?? ''), taskId],
    queryFn: () => getTask(accessToken ?? '', taskId ?? ''),
    enabled: Boolean(accessToken && userId && taskId),
  })

export const useTaskAdvice = (
  accessToken: string | null,
  userId: string | undefined,
  taskId: string | null,
) =>
  useQuery({
    queryKey: [...gameQueryKeys.advice(userId ?? ''), taskId],
    queryFn: () => getTaskAdvice(accessToken ?? '', taskId ?? ''),
    enabled: Boolean(accessToken && userId && taskId),
    staleTime: 5 * 60 * 1000,
  })

export const invalidateGameQueriesForEvents = async (
  queryClient: QueryClient,
  userId: string | undefined,
  events: readonly GameEvent[],
) => {
  if (!userId || events.length === 0) {
    return
  }

  const affectedQueries = new Set<keyof typeof gameQueryKeys>(['daily'])

  events.forEach((event) => {
    switch (event.type) {
      case 'TASK_PROGRESS_UPDATED':
      case 'TASK_COMPLETED':
        affectedQueries.add('tasks')
        affectedQueries.add('advice')
        break
      case 'XP_EARNED':
      case 'PET_LEVEL_UP':
      case 'PET_MOOD_CHANGED':
      case 'PET_CHARACTER_UNLOCKED':
        affectedQueries.add('pet')
        affectedQueries.add('advice')
        break
      case 'ROOM_ITEM_UNLOCKED':
        affectedQueries.add('room')
        break
      case 'STORY_STAGE_COMPLETED':
      case 'STORY_COMPLETED':
        affectedQueries.add('story')
        affectedQueries.add('pet')
        break
      case 'LEADERBOARD_SCORE_UPDATED':
        affectedQueries.add('leaderboard')
        break
      case 'ACHIEVEMENT_UNLOCKED':
        affectedQueries.add('achievements')
        break
      case 'AVITO_REWARD_EARNED':
      case 'REWARD_CATALOG_UNLOCKED':
        affectedQueries.add('wallet')
        break
      case 'DAILY_QUEST_UPDATED':
      case 'DAILY_QUEST_COMPLETED':
      case 'DAILY_GOAL_COMPLETED':
      case 'BALANCED_DAY_COMPLETED':
      case 'STREAK_UPDATED':
        affectedQueries.add('daily')
        break
    }
  })

  await Promise.all(
    [...affectedQueries].map((key) =>
      queryClient.invalidateQueries({ queryKey: gameQueryKeys[key](userId) }),
    ),
  )
}

export const useGameAction = (
  accessToken: string | null,
  userId: string | undefined,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: ActionRequest) =>
      postAction(accessToken ?? '', action),
    onSuccess: async (result) => {
      await invalidateGameQueriesForEvents(queryClient, userId, result.events)
    },
  })
}
