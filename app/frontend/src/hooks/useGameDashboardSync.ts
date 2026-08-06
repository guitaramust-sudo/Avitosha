import { useEffect } from 'react'

import { selectIsGameReady, syncGameDashboard } from '../store/gameSlice'
import { useAppDispatch, useAppSelector } from './redux'
import type { GameDashboardQueries } from './useGameDashboard'

export const useGameDashboardSync = (
  userId: string | undefined,
  dashboard: GameDashboardQueries,
) => {
  const dispatch = useAppDispatch()
  const gameOwnerId = useAppSelector((state) => state.game.ownerId)
  const isGameReady = useAppSelector(selectIsGameReady)
  const achievements = dashboard.achievements.data
  const daily = dashboard.daily.data
  const leaderboard = dashboard.leaderboard.data
  const pet = dashboard.pet.data
  const room = dashboard.room.data
  const story = dashboard.story.data
  const tasks = dashboard.tasks.data
  const wallet = dashboard.wallet.data

  useEffect(() => {
    if (
      !userId ||
      achievements === undefined ||
      daily === undefined ||
      leaderboard === undefined ||
      pet === undefined ||
      room === undefined ||
      story === undefined ||
      tasks === undefined ||
      wallet === undefined
    ) {
      return
    }

    dispatch(
      syncGameDashboard({
        achievements,
        daily,
        leaderboard,
        ownerId: userId,
        pet,
        room,
        story,
        tasks,
        wallet,
      }),
    )
  }, [
    achievements,
    daily,
    dispatch,
    leaderboard,
    pet,
    room,
    story,
    tasks,
    userId,
    wallet,
  ])

  return isGameReady && gameOwnerId === userId
}
