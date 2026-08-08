import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { useRegisterMutation } from '../../hooks/useRegisterMutation'
import { getRegistrationError } from '../../utils/apiErrors'
import AuthFormField from '../AuthForm/AuthFormField'
import { type RegisterFormValues, registerSchema } from './registerSchema'

import '../AuthForm/AuthForm.scss'

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
    if (isSubmissionLocked || registerMutation.isPending) return

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
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="auth-form__heading">
        <span>Добро пожаловать!</span>
        <h1>Создайте аккаунт</h1>
        <p>Зарегистрируйтесь, чтобы заботиться об Авитоше.</p>
      </div>

      {serverError && (
        <div className="auth-form__server-error" role="alert">
          {serverError}
        </div>
      )}

      <AuthFormField
        id="register-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        field={register('email')}
        error={errors.email?.message}
      />
      <AuthFormField
        id="register-password"
        label="Пароль"
        type="password"
        autoComplete="new-password"
        placeholder="Минимум 8 символов"
        field={register('password')}
        error={errors.password?.message}
      />
      <AuthFormField
        id="register-confirm-password"
        label="Повторите пароль"
        type="password"
        autoComplete="new-password"
        placeholder="Повторите пароль"
        field={register('confirmPassword')}
        error={errors.confirmPassword?.message}
      />

      <button className="auth-form__submit" type="submit" disabled={isPending}>
        {isPending ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
      </button>

      <p className="auth-form__footer">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </form>
  )
}

export default RegisterForm
