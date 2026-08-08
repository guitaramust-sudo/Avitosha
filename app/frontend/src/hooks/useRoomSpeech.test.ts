import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ROOM_ADVICE_DELAY_MS, useRoomSpeech } from './useRoomSpeech'

describe('useRoomSpeech', () => {
  afterEach(() => vi.useRealTimers())

  it('показывает совет после скрытия цели и задержки', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useRoomSpeech({
        adviceTaskId: 'task-1',
        adviceText: 'Совет Авитоши',
        goalKey: 'task-1',
        goalText: 'Следующая цель',
      }),
    )

    expect(result.current.speechText).toBe('Следующая цель')

    act(() => result.current.hideSpeech())
    expect(result.current.isHiding).toBe(true)

    act(() => result.current.finishHidingSpeech())
    expect(result.current.speechText).toBeNull()

    act(() => vi.advanceTimersByTime(ROOM_ADVICE_DELAY_MS))
    expect(result.current.speechText).toBe('Совет Авитоши')
    expect(result.current.isAdviceVisible).toBe(true)
  })

  it('показывает совет с задержкой, когда цели нет', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useRoomSpeech({
        adviceTaskId: 'task-1',
        adviceText: 'Совет Авитоши',
        goalKey: 'room-intro',
        goalText: null,
      }),
    )

    act(() => vi.advanceTimersByTime(ROOM_ADVICE_DELAY_MS))

    expect(result.current.speechText).toBe('Совет Авитоши')
  })
})
