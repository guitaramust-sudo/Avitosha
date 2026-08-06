import { useMutation, useQueryClient } from '@tanstack/react-query'

import { renamePet } from '../api/game'
import { useAppSelector } from './redux'
import { gameQueryKeys } from './useGameDashboard'

export const useRenamePetMutation = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const userId = useAppSelector((state) => state.auth.user?.id)
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
