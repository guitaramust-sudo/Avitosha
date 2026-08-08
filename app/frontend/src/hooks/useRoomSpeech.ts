import { useCallback, useEffect, useState } from 'react'

export const ROOM_ADVICE_DELAY_MS = 5000

interface UseRoomSpeechOptions {
  adviceTaskId: string | null
  adviceText?: string | null
  goalKey: string
  goalText: string | null
}

export const useRoomSpeech = ({
  adviceTaskId,
  adviceText,
  goalKey,
  goalText,
}: UseRoomSpeechOptions) => {
  const [dismissedAdviceKey, setDismissedAdviceKey] = useState<string | null>(
    null,
  )
  const [dismissedGoalKey, setDismissedGoalKey] = useState<string | null>(null)
  const [hidingSpeechKey, setHidingSpeechKey] = useState<string | null>(null)
  const [readyAdviceKey, setReadyAdviceKey] = useState<string | null>(null)
  const isGoalDismissed = !goalText || dismissedGoalKey === goalKey

  useEffect(() => {
    if (!adviceTaskId || !isGoalDismissed) return

    const timeoutId = window.setTimeout(() => {
      setReadyAdviceKey(adviceTaskId)
    }, ROOM_ADVICE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [adviceTaskId, isGoalDismissed])

  const isGoalVisible = Boolean(goalText && !isGoalDismissed)
  const isAdviceVisible = Boolean(
    adviceTaskId &&
    isGoalDismissed &&
    readyAdviceKey === adviceTaskId &&
    dismissedAdviceKey !== adviceTaskId &&
    adviceText,
  )
  const activeSpeechKey = isGoalVisible
    ? `goal:${goalKey}`
    : isAdviceVisible
      ? `advice:${adviceTaskId}`
      : null
  const speechText = isGoalVisible
    ? goalText
    : isAdviceVisible
      ? adviceText
      : null
  const isHiding = Boolean(
    activeSpeechKey && hidingSpeechKey === activeSpeechKey,
  )

  const hideSpeech = useCallback(() => {
    if (activeSpeechKey && hidingSpeechKey !== activeSpeechKey) {
      setHidingSpeechKey(activeSpeechKey)
    }
  }, [activeSpeechKey, hidingSpeechKey])

  const finishHidingSpeech = useCallback(() => {
    if (!activeSpeechKey || hidingSpeechKey !== activeSpeechKey) return

    if (activeSpeechKey.startsWith('goal:')) {
      setDismissedGoalKey(goalKey)
    } else if (adviceTaskId) {
      setDismissedAdviceKey(adviceTaskId)
    }
    setHidingSpeechKey(null)
  }, [activeSpeechKey, adviceTaskId, goalKey, hidingSpeechKey])

  return {
    activeSpeechKey,
    finishHidingSpeech,
    hideSpeech,
    isAdviceVisible,
    isHiding,
    speechText,
  }
}
