import { ApiError } from '../api/client'

export type RegistrationField = 'email' | 'password'

export interface RegistrationError {
  field?: RegistrationField
  message: string
}

export interface LoginError {
  field?: RegistrationField
  message: string
}

const invalidRequestError = (message: string): RegistrationError => {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('email')) {
    return {
      field: 'email',
      message: normalizedMessage.includes('required')
        ? 'Введите email.'
        : 'Введите корректный email.',
    }
  }

  if (normalizedMessage.includes('password')) {
    return {
      field: 'password',
      message: normalizedMessage.includes('required')
        ? 'Введите пароль.'
        : 'Пароль должен содержать от 8 до 128 символов.',
    }
  }

  return { message: 'Проверьте введённые данные.' }
}

export const getRegistrationError = (error: unknown): RegistrationError => {
  if (!(error instanceof ApiError)) {
    return { message: 'Произошла неизвестная ошибка. Попробуйте ещё раз.' }
  }

  switch (error.code) {
    case 'email_already_exists':
      return {
        field: 'email',
        message: 'Пользователь с таким email уже существует.',
      }
    case 'invalid_request':
      return invalidRequestError(error.message)
    case 'network_error':
      return { message: error.message }
    case 'internal_error':
      return { message: 'Сервер временно недоступен. Попробуйте позже.' }
    default:
      return { message: 'Не удалось зарегистрироваться. Попробуйте ещё раз.' }
  }
}

export const getLoginError = (error: unknown): LoginError => {
  if (!(error instanceof ApiError)) {
    return { message: 'Произошла неизвестная ошибка. Попробуйте ещё раз.' }
  }

  switch (error.code) {
    case 'invalid_credentials':
      return { message: 'Неверный email или пароль.' }
    case 'invalid_request':
      return invalidRequestError(error.message)
    case 'network_error':
      return { message: error.message }
    case 'internal_error':
      return { message: 'Сервер временно недоступен. Попробуйте позже.' }
    default:
      return { message: 'Не удалось войти. Попробуйте ещё раз.' }
  }
}
