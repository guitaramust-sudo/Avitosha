import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { acceptGameEvents } from '../store/gameSlice'
import { showToast } from '../store/toastSlice'
import type { GameEvent } from '../types/game'
import { getGameEventMessage } from '../utils/gamePresentation'
import { useAppDispatch } from './redux'
import {
  gameQueryKey,
  invalidateGameQueriesForEvents,
} from './useGameDashboard'

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? window.location.origin
).replace(/\/$/, '')

const socketBaseUrl = apiBaseUrl.replace(/^http/, 'ws')

export const useGameSocket = (
  accessToken: string | null,
  userId: string | undefined,
) => {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!accessToken || !userId) return

    let socket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let disposed = false
    let hasConnected = false
    let reconnectAttempts = 0

    const connect = () => {
      socket = new WebSocket(
        `${socketBaseUrl}/api/v1/ws?access_token=${encodeURIComponent(accessToken)}`,
      )
      socket.onopen = () => {
        reconnectAttempts = 0
        if (hasConnected) {
          void queryClient.invalidateQueries({ queryKey: gameQueryKey(userId) })
        }
        hasConnected = true
      }
      socket.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data) as { events?: GameEvent[] }
          if (!payload.events?.length) return
          const acceptedEvents = dispatch(acceptGameEvents(payload.events))

          if (acceptedEvents.length === 0) {
            return
          }

          void invalidateGameQueriesForEvents(
            queryClient,
            userId,
            acceptedEvents,
          )
          dispatch(showToast({ message: getGameEventMessage(acceptedEvents) }))
        } catch {
          // Ignore malformed realtime payloads and keep the connection alive.
        }
      }
      socket.onclose = (event) => {
        if (disposed || event.code === 1008) {
          return
        }

        const reconnectDelay = Math.min(30_000, 2_000 * 2 ** reconnectAttempts)
        reconnectAttempts += 1
        reconnectTimer = window.setTimeout(connect, reconnectDelay)
      }
    }

    connect()
    return () => {
      disposed = true
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [accessToken, dispatch, queryClient, userId])
}
