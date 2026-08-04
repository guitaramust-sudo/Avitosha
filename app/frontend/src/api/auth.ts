import type {
  AuthResponse,
  AuthSession,
  CurrentUserResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
} from '../types/auth'
import { apiRequest } from './client'

export const registerUser = async (
  credentials: RegisterRequest,
): Promise<AuthSession> => {
  const response = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  return {
    accessToken: response.access_token,
    user: response.user,
  }
}

export const loginUser = async (
  credentials: LoginRequest,
): Promise<AuthSession> => {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  return {
    accessToken: response.access_token,
    user: response.user,
  }
}

export const refreshSession = async (): Promise<string> => {
  const response = await apiRequest<RefreshResponse>('/api/auth/refresh', {
    method: 'POST',
  })

  return response.access_token
}

export const logoutUser = async (): Promise<void> => {
  await apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  })
}

export const getCurrentUser = async (
  accessToken: string,
): Promise<CurrentUserResponse['user']> => {
  const response = await apiRequest<CurrentUserResponse>('/api/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return response.user
}

export const restoreSession = async (): Promise<AuthSession> => {
  const accessToken = await refreshSession()
  const user = await getCurrentUser(accessToken)

  return { accessToken, user }
}
