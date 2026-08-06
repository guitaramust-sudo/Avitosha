const onboardingKey = (userId: string) =>
  `avitosha:first-visit-onboarding:${userId}`

export const markOnboardingPending = (userId: string) => {
  try {
    localStorage.setItem(onboardingKey(userId), 'pending')
  } catch {
    // Registration must remain usable when browser storage is unavailable.
  }
}

export const isOnboardingPending = (userId: string) => {
  try {
    return localStorage.getItem(onboardingKey(userId)) === 'pending'
  } catch {
    return false
  }
}

export const clearPendingOnboarding = (userId: string) => {
  try {
    localStorage.removeItem(onboardingKey(userId))
  } catch {
    // The Redux state still completes the current onboarding session.
  }
}
