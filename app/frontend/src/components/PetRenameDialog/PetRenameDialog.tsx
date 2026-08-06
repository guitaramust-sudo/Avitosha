import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'

import { ApiError } from '../../api/client'
import { useAppDispatch } from '../../hooks/redux'
import { useRenamePetMutation } from '../../hooks/useRenamePetMutation'
import { showToast } from '../../store/toastSlice'
import { type PetRenameFormValues, petRenameSchema } from './petRenameSchema'

import './PetRenameDialog.scss'

interface PetRenameDialogProps {
  currentName: string
  isFirstVisit?: boolean
  onClose: () => void
}

function PetRenameDialog({
  currentName,
  isFirstVisit = false,
  onClose,
}: PetRenameDialogProps) {
  const dispatch = useAppDispatch()
  const renameMutation = useRenamePetMutation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<PetRenameFormValues>({
    defaultValues: { name: currentName },
    resolver: zodResolver(petRenameSchema),
    mode: 'onTouched',
  })
  const nameField = register('name')

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    inputRef.current?.focus()
    inputRef.current?.select()
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const onSubmit: SubmitHandler<PetRenameFormValues> = async ({ name }) => {
    setServerError(null)

    try {
      const pet = await renameMutation.mutateAsync(name)
      dispatch(showToast({ message: `Теперь питомца зовут ${pet.name}!` }))
      onClose()
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Не удалось изменить имя. Попробуйте ещё раз.',
      )
    }
  }

  const isPending = isSubmitting || renameMutation.isPending

  return (
    <div
      className="pet-rename-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="pet-rename-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pet-rename-title"
      >
        <button
          className="pet-rename-dialog__close"
          type="button"
          aria-label="Закрыть переименование"
          onClick={onClose}
        >
          ×
        </button>
        <span className="pet-rename-dialog__eyebrow">
          {isFirstVisit ? 'Первое знакомство' : 'Профиль питомца'}
        </span>
        <h2 id="pet-rename-title">
          {isFirstVisit ? 'Придумайте имя питомцу' : 'Как зовут Авитошу?'}
        </h2>
        <p>
          Имя можно написать только русскими буквами, с пробелом или дефисом.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="pet-name">Имя питомца</label>
          <input
            {...nameField}
            ref={(element) => {
              nameField.ref(element)
              inputRef.current = element
            }}
            id="pet-name"
            autoComplete="off"
            maxLength={20}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'pet-name-error' : undefined}
          />
          {errors.name && (
            <span id="pet-name-error" role="alert">
              {errors.name.message}
            </span>
          )}
          {serverError && <div role="alert">{serverError}</div>}
          <div className="pet-rename-dialog__actions">
            <button type="button" onClick={onClose} disabled={isPending}>
              {isFirstVisit ? 'Оставить Авитошей' : 'Отмена'}
            </button>
            <button type="submit" disabled={isPending}>
              {isPending ? 'Сохраняем…' : 'Сохранить имя'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default PetRenameDialog
