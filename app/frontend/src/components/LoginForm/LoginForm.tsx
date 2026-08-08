import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { useLoginMutation } from '../../hooks/useLoginMutation'
import { getLoginError } from '../../utils/apiErrors'
import AuthFormField from '../AuthForm/AuthFormField'
import { type LoginFormValues, loginSchema } from './loginSchema'

import '../AuthForm/AuthForm.scss'

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
    if (loginMutation.isPending) return

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
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="auth-form__heading">
        <span>С возвращением!</span>
        <h1>Войдите в аккаунт</h1>
        <p>Продолжайте заботиться об Авитоше.</p>
      </div>

      {serverError && (
        <div className="auth-form__server-error" role="alert">
          {serverError}
        </div>
      )}

      <AuthFormField
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        field={register('email')}
        error={errors.email?.message}
      />
      <AuthFormField
        id="login-password"
        label="Пароль"
        type="password"
        autoComplete="current-password"
        placeholder="Введите пароль"
        field={register('password')}
        error={errors.password?.message}
      />

      <button className="auth-form__submit" type="submit" disabled={isPending}>
        {isPending ? 'Входим…' : 'Войти'}
      </button>

      <p className="auth-form__footer">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </form>
  )
}

export default LoginForm
