import { useMutation, useQueryClient } from '@tanstack/react-query'

import { renamePet } from '../api/game'
import { useAuthCredentials } from './redux'
import { gameQueryKeys } from './useGameDashboard'

export const useRenamePetMutation = () => {
  const { accessToken, userId } = useAuthCredentials()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => renamePet(accessToken ?? '', name),
    onSuccess: async (pet) => {
      if (!userId) return

      queryClient.setQueryData(gameQueryKeys.pet(userId), pet)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: gameQueryKeys.leaderboard(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: gameQueryKeys.advice(userId),
        }),
      ])
    },
  })
}
