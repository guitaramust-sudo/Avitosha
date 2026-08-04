import { useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { dismissToast } from '../../store/toastSlice'

import './ToastViewport.scss'

const TOAST_DURATION = 3500

function ToastViewport() {
  const dispatch = useAppDispatch()
  const toast = useAppSelector((state) => state.toast)

  useEffect(() => {
    if (!toast.message) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(dismissToast(toast.id))
    }, TOAST_DURATION)

    return () => window.clearTimeout(timeoutId)
  }, [dispatch, toast.id, toast.message])

  if (!toast.message) {
    return null
  }

  return (
    <div
      className={`toast toast--${toast.tone}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast__icon" aria-hidden="true">
        {toast.tone === 'success' ? '✓' : '!'}
      </span>
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__close"
        type="button"
        aria-label="Закрыть уведомление"
        onClick={() => dispatch(dismissToast(toast.id))}
      >
        ×
      </button>
    </div>
  )
}

export default ToastViewport
