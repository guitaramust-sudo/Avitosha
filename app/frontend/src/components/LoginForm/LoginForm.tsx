import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { useLoginMutation } from '../../hooks/useLoginMutation'
import { getLoginError } from '../../utils/apiErrors'
import { type LoginFormValues, loginSchema } from './loginSchema'

import './LoginForm.scss'

const fieldErrorId = (field: keyof LoginFormValues) => `login-${field}-error`

function LoginForm() {
  const loginMutation = useLoginMutation()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    if (loginMutation.isPending) {
      return
    }

    setServerError(null)
    clearErrors(['email', 'password'])
    loginMutation.reset()

    try {
      await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      })
    } catch (error) {
      const loginError = getLoginError(error)

      if (loginError.field) {
        setError(loginError.field, {
          type: 'server',
          message: loginError.message,
        })
      } else {
        setServerError(loginError.message)
      }
    }
  }

  const isPending = isSubmitting || loginMutation.isPending

  return (
    <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="login-form__heading">
        <span>С возвращением!</span>
        <h1>Войдите в аккаунт</h1>
        <p>Продолжайте заботиться об Авитоше.</p>
      </div>

      {serverError && (
        <div className="login-form__server-error" role="alert">
          {serverError}
        </div>
      )}

      <div className="login-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
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

      <div className="login-field">
        <label htmlFor="login-password">Пароль</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Введите пароль"
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

      <button className="login-form__submit" type="submit" disabled={isPending}>
        {isPending ? 'Входим…' : 'Войти'}
      </button>

      <p className="login-form__register">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </form>
  )
}

export default LoginForm
