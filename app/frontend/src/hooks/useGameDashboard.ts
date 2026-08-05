import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getAchievements,
  getDailySummary,
  getLeaderboard,
  getPet,
  getRoom,
  getStory,
  getTasks,
  postAction,
} from '../api/game'
import type { ActionRequest } from '../types/game'

export const gameQueryKey = ['game'] as const

export const useGameDashboard = (accessToken: string | null) => {
  const enabled = Boolean(accessToken)
  const token = accessToken ?? ''

  const pet = useQuery({
    queryKey: [...gameQueryKey, 'pet'],
    queryFn: () => getPet(token),
    enabled,
  })
  const tasks = useQuery({
    queryKey: [...gameQueryKey, 'tasks'],
    queryFn: () => getTasks(token),
    enabled,
  })
  const room = useQuery({
    queryKey: [...gameQueryKey, 'room'],
    queryFn: () => getRoom(token),
    enabled,
  })
  const story = useQuery({
    queryKey: [...gameQueryKey, 'story'],
    queryFn: () => getStory(token),
    enabled,
  })
  const daily = useQuery({
    queryKey: [...gameQueryKey, 'daily-summary'],
    queryFn: () => getDailySummary(token),
    enabled,
  })
  const leaderboard = useQuery({
    queryKey: [...gameQueryKey, 'leaderboard'],
    queryFn: () => getLeaderboard(token),
    enabled,
  })
  const achievements = useQuery({
    queryKey: [...gameQueryKey, 'achievements'],
    queryFn: () => getAchievements(token),
    enabled,
  })

  return { pet, tasks, room, story, daily, leaderboard, achievements }
}

export const useGameAction = (accessToken: string | null) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: ActionRequest) =>
      postAction(accessToken ?? '', action),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: gameQueryKey })
    },
  })
}
