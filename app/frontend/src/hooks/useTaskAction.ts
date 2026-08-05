import { useCallback } from 'react'

import { acceptGameEvents } from '../store/gameSlice'
import { showToast } from '../store/toastSlice'
import type { GameTask } from '../types/game'
import { getGameEventMessage } from '../utils/gamePresentation'
import { useAppDispatch } from './redux'
import { useGameAction } from './useGameDashboard'

export const useTaskAction = (
  accessToken: string | null,
  userId: string | undefined,
) => {
  const dispatch = useAppDispatch()
  const { isPending, mutateAsync } = useGameAction(accessToken, userId)

  const performTaskAction = useCallback(
    async (task: GameTask) => {
      try {
        const result = await mutateAsync({
          eventId: crypto.randomUUID(),
          type: task.actionType,
          entityId: `demo-${crypto.randomUUID()}`,
          ...(task.category ? { category: task.category } : {}),
          occurredAt: new Date().toISOString(),
          metadata: { source: 'avitosha-demo' },
        })

        const acceptedEvents = dispatch(acceptGameEvents(result.events))

        if (
          !result.duplicate &&
          result.events.length > 0 &&
          acceptedEvents.length === 0
        ) {
          return
        }

        dispatch(
          showToast({
            message: result.duplicate
              ? 'Это действие уже было учтено.'
              : acceptedEvents.length > 0
                ? getGameEventMessage(acceptedEvents)
                : 'Действие учтено — прогресс обновлён!',
          }),
        )
      } catch {
        dispatch(
          showToast({
            message: 'Не удалось выполнить действие. Попробуйте ещё раз.',
            tone: 'error',
          }),
        )
      }
    },
    [dispatch, mutateAsync],
  )

  return {
    isPending,
    performTaskAction,
  }
}
