import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { useRegisterMutation } from '../../hooks/useRegisterMutation'
import { getRegistrationError } from '../../utils/apiErrors'
import { type RegisterFormValues, registerSchema } from './registerSchema'

import './RegisterForm.scss'

const fieldErrorId = (field: keyof RegisterFormValues) =>
  `register-${field}-error`

function RegisterForm() {
  const registerMutation = useRegisterMutation()
  const [isSubmissionLocked, setIsSubmissionLocked] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    if (isSubmissionLocked || registerMutation.isPending) {
      return
    }

    setIsSubmissionLocked(true)
    setServerError(null)
    clearErrors(['email', 'password'])
    registerMutation.reset()

    try {
      await registerMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      })
    } catch (error) {
      const registrationError = getRegistrationError(error)

      if (registrationError.field) {
        setError(registrationError.field, {
          type: 'server',
          message: registrationError.message,
        })
      } else {
        setServerError(registrationError.message)
      }
    } finally {
      setIsSubmissionLocked(false)
    }
  }

  const isPending =
    isSubmitting || isSubmissionLocked || registerMutation.isPending

  return (
    <form
      className="register-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="register-form__heading">
        <span>Добро пожаловать!</span>
        <h1>Создайте аккаунт</h1>
        <p>Зарегистрируйтесь, чтобы заботиться об Авитоше.</p>
      </div>

      {serverError && (
        <div className="register-form__server-error" role="alert">
          {serverError}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? fieldErrorId('email') : undefined}
          {...register('email')}
        />
        {errors.email && (
          <span id={fieldErrorId('email')} role="alert">
            {errors.email.message}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="register-password">Пароль</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Минимум 8 символов"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? fieldErrorId('password') : undefined
          }
          {...register('password')}
        />
        {errors.password && (
          <span id={fieldErrorId('password')} role="alert">
            {errors.password.message}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="register-confirm-password">Повторите пароль</label>
        <input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Повторите пароль"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? fieldErrorId('confirmPassword') : undefined
          }
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <span id={fieldErrorId('confirmPassword')} role="alert">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <button
        className="register-form__submit"
        type="submit"
        disabled={isPending}
      >
        {isPending ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
      </button>

      <p className="register-form__login">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </form>
  )
}

export default RegisterForm
