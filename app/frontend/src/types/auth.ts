export interface User {
  id: string
  email: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export type LoginRequest = RegisterRequest

export interface AuthResponse {
  access_token: string
  user: User
}

export interface RefreshResponse {
  access_token: string
}

export interface CurrentUserResponse {
  user: User
}

export interface AuthSession {
  accessToken: string
  user: User
}
