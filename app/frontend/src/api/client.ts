import type { ApiErrorCode, ApiErrorPayload } from '../types/api'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  code: ApiErrorCode

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const isApiErrorPayload = (value: unknown): value is ApiErrorPayload => {
  if (!value || typeof value !== 'object' || !('error' in value)) {
    return false
  }

  const error = value.error

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  )
}

const toApiErrorCode = (code: string): ApiErrorCode => {
  const knownCodes: ApiErrorCode[] = [
    'email_already_exists',
    'internal_error',
    'invalid_credentials',
    'invalid_request',
    'session_expired',
    'unauthorized',
  ]

  return knownCodes.includes(code as ApiErrorCode)
    ? (code as ApiErrorCode)
    : 'unknown_error'
}

const readResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(
      0,
      'network_error',
      'Не удалось соединиться с сервером. Проверьте подключение к интернету.',
    )
  }

  const body = await readResponseBody(response)

  if (!response.ok) {
    if (isApiErrorPayload(body)) {
      throw new ApiError(
        response.status,
        toApiErrorCode(body.error.code),
        body.error.message,
      )
    }

    throw new ApiError(
      response.status,
      response.status >= 500 ? 'internal_error' : 'unknown_error',
      'Сервер вернул неожиданный ответ.',
    )
  }

  return body as T
}
