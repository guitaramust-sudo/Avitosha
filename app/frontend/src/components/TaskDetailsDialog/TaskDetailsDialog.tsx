import { useEffect, useRef } from 'react'

import { useAppSelector } from '../../hooks/redux'
import { useGameTask } from '../../hooks/useGameDashboard'
import {
  roomItemLabels,
  taskActionLabels,
  taskStatusLabels,
} from '../../utils/gamePresentation'

import './TaskDetailsDialog.scss'

interface TaskDetailsDialogProps {
  onClose: () => void
  taskId: string | null
}

function TaskDetailsDialog({ onClose, taskId }: TaskDetailsDialogProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const taskQuery = useGameTask(accessToken, userId, taskId)

  useEffect(() => {
    if (!taskId) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, taskId])

  if (!taskId) {
    return null
  }

  const task = taskQuery.data

  return (
    <div
      className="task-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="task-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-dialog-title"
      >
        <button
          ref={closeButtonRef}
          className="task-dialog__close"
          type="button"
          aria-label="Закрыть детали задания"
          onClick={onClose}
        >
          ×
        </button>

        {taskQuery.isPending && (
          <div className="task-dialog__state" role="status">
            Загружаем задание…
          </div>
        )}

        {taskQuery.isError && (
          <div className="task-dialog__state" role="alert">
            <p>Не удалось получить детали задания.</p>
            <button type="button" onClick={() => void taskQuery.refetch()}>
              Повторить
            </button>
          </div>
        )}

        {task && (
          <>
            <span className="task-dialog__status">
              {taskStatusLabels[task.status]}
            </span>
            <h2 id="task-dialog-title">{task.title}</h2>
            <p>{task.description}</p>
            <blockquote>{task.petPhrase}</blockquote>

            <dl className="task-dialog__facts">
              <div>
                <dt>Прогресс</dt>
                <dd>
                  {task.progress}/{task.target}
                </dd>
              </div>
              <div>
                <dt>Награда</dt>
                <dd>{task.xpReward} XP</dd>
              </div>
              <div>
                <dt>Действие</dt>
                <dd>{taskActionLabels[task.actionType]}</dd>
              </div>
              {task.storyStage && (
                <div>
                  <dt>Этап истории</dt>
                  <dd>{task.storyStage}</dd>
                </div>
              )}
              {task.category && (
                <div>
                  <dt>Категория</dt>
                  <dd>{task.category}</dd>
                </div>
              )}
              {task.roomItemCode && (
                <div>
                  <dt>Предмет</dt>
                  <dd>{roomItemLabels[task.roomItemCode]}</dd>
                </div>
              )}
              {task.avitoRewardType && (
                <div>
                  <dt>Бонус Авито</dt>
                  <dd>{task.avitoRewardAmount}</dd>
                </div>
              )}
            </dl>
          </>
        )}
      </section>
    </div>
  )
}

export default TaskDetailsDialog
