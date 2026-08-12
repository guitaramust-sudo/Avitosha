import { type CSSProperties, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { selectGamePet } from '../../store/gameSlice'
import {
  beginOnboarding,
  beginOnboardingTour,
  finishOnboarding,
  selectOnboarding,
} from '../../store/onboardingSlice'
import {
  clearPendingOnboarding,
  isOnboardingPending,
} from '../../utils/onboardingStorage'
import PetRenameDialog from '../PetRenameDialog/PetRenameDialog'

import './FirstVisitOnboarding.scss'

const tourSteps = [
  {
    path: '/progress',
    target: 'tasks',
    title: 'Задания и достижения',
    description:
      'Выполняйте задания, получайте опыт, предметы для комнаты и достижения.',
  },
  {
    path: '/',
    target: 'room',
    title: 'Комната Авитоши',
    description:
      'Здесь живёт питомец. Открытые предметы можно свободно расставлять по комнате.',
  },
  {
    path: '/',
    target: 'collection',
    title: 'Коллекция предметов',
    description:
      'Перетаскивайте доступные предметы в комнату. Заблокированные откроются за задания.',
  },
  {
    path: '/progress',
    target: 'character',
    title: 'Характер питомца',
    description:
      'Действия на Avito формируют характер Авитоши и открывают новые особенности.',
  },
  {
    path: '/leaderboard',
    target: 'leaderboard',
    title: 'Таблица лидеров',
    description:
      'Сравнивайте недельный прогресс и место Авитоши с другими игроками.',
  },
  {
    path: '/rewards',
    target: 'wallet',
    title: 'Кошелёк наград',
    description:
      'Здесь видны Avito-бонусы, открытые награды и прогресс до следующей цели.',
  },
  {
    path: '/rewards',
    target: 'retention',
    title: 'Возвращайтесь каждый день',
    description:
      'Выполняйте любые два задания из пяти, сохраняйте серию дней и получайте дополнительные бонусы за обе роли.',
  },
] as const

interface HighlightRect {
  height: number
  left: number
  top: number
  width: number
}

function FirstVisitOnboarding() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const userId = useAppSelector((state) => state.auth.user?.id)
  const pet = useAppSelector(selectGamePet)
  const onboarding = useAppSelector(selectOnboarding)
  const [stepIndex, setStepIndex] = useState(0)
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)

  useEffect(() => {
    if (userId && onboarding.stage === 'idle' && isOnboardingPending(userId)) {
      dispatch(beginOnboarding(userId))
    }
  }, [dispatch, onboarding.stage, userId])

  const completeOnboarding = useCallback(() => {
    if (userId) clearPendingOnboarding(userId)
    dispatch(finishOnboarding())
  }, [dispatch, userId])

  const advanceTour = useCallback(() => {
    if (stepIndex === tourSteps.length - 1) {
      completeOnboarding()
      return
    }

    setStepIndex((current) => current + 1)
  }, [completeOnboarding, stepIndex])

  useEffect(() => {
    if (onboarding.stage !== 'tour') return

    const step = tourSteps[stepIndex]
    if (location.pathname !== step.path) {
      void navigate(step.path)
      return
    }

    const target = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    )
    if (!target) return

    const updateHighlight = () => {
      const rect = target.getBoundingClientRect()
      setHighlightRect({
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      })
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    updateHighlight()
    const updateTimer = window.setTimeout(updateHighlight, 350)
    window.addEventListener('resize', updateHighlight)
    window.addEventListener('scroll', updateHighlight, true)

    return () => {
      window.clearTimeout(updateTimer)
      window.removeEventListener('resize', updateHighlight)
      window.removeEventListener('scroll', updateHighlight, true)
    }
  }, [location.pathname, navigate, onboarding.stage, stepIndex])

  useEffect(() => {
    if (onboarding.stage !== 'tour') return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') completeOnboarding()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [completeOnboarding, onboarding.stage])

  if (!userId || onboarding.ownerId !== userId) return null

  if (onboarding.stage === 'naming') {
    if (!pet) return null

    return (
      <PetRenameDialog
        currentName={pet.name}
        isFirstVisit
        onClose={() => dispatch(beginOnboardingTour())}
      />
    )
  }

  if (onboarding.stage !== 'tour' || !highlightRect) return null

  const step = tourSteps[stepIndex]
  const tooltipTop =
    highlightRect.top + highlightRect.height + 170 < window.innerHeight
      ? highlightRect.top + highlightRect.height + 14
      : Math.max(14, highlightRect.top - 160)
  const overlayStyle = {
    '--tour-height': `${highlightRect.height}px`,
    '--tour-left': `${highlightRect.left}px`,
    '--tour-top': `${highlightRect.top}px`,
    '--tour-width': `${highlightRect.width}px`,
    '--tooltip-top': `${tooltipTop}px`,
  } as CSSProperties

  return (
    <div
      className="first-visit-tour"
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Знакомство с приложением"
      onClick={advanceTour}
    >
      <div className="first-visit-tour__highlight" aria-hidden="true" />
      <section className="first-visit-tour__tooltip" aria-live="polite">
        <span>
          Шаг {stepIndex + 1} из {tourSteps.length}
        </span>
        <h2>{step.title}</h2>
        <p>{step.description}</p>
        <div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              completeOnboarding()
            }}
          >
            Пропустить
          </button>
          <strong>
            {stepIndex === tourSteps.length - 1
              ? 'Нажмите, чтобы закончить'
              : 'Далее'}
          </strong>
        </div>
      </section>
    </div>
  )
}

export default FirstVisitOnboarding
