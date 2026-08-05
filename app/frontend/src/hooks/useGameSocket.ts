import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { showToast } from '../store/toastSlice'
import type { GameEvent } from '../types/game'
import { useAppDispatch } from './redux'
import { gameQueryKey } from './useGameDashboard'

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? window.location.origin
).replace(/\/$/, '')

const socketBaseUrl = apiBaseUrl.replace(/^http/, 'ws')

const eventMessage = (events: GameEvent[]) => {
  const item = events.find((event) => event.type === 'ROOM_ITEM_UNLOCKED')
  if (item) return `Новый предмет в комнате: ${String(item.itemCode)}`
  const level = events.find((event) => event.type === 'PET_LEVEL_UP')
  if (level) return `Новый уровень Авитоши: ${String(level.level)}`
  const completed = events.find((event) => event.type === 'TASK_COMPLETED')
  if (completed) return 'Задание выполнено — Авитоша радуется!'
  return 'Прогресс Авитоши обновлён'
}

export const useGameSocket = (accessToken: string | null) => {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!accessToken) return

    let socket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let disposed = false

    const connect = () => {
      socket = new WebSocket(
        `${socketBaseUrl}/api/v1/ws?access_token=${encodeURIComponent(accessToken)}`,
      )
      socket.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data) as { events?: GameEvent[] }
          if (!payload.events?.length) return
          void queryClient.invalidateQueries({ queryKey: gameQueryKey })
          dispatch(showToast({ message: eventMessage(payload.events) }))
        } catch {
          // Ignore malformed realtime payloads and keep the connection alive.
        }
      }
      socket.onclose = () => {
        if (!disposed) reconnectTimer = window.setTimeout(connect, 2000)
      }
    }

    connect()
    return () => {
      disposed = true
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [accessToken, dispatch, queryClient])
}
