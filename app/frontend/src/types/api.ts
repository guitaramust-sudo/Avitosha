export type ApiErrorCode =
  | 'email_already_exists'
  | 'internal_error'
  | 'invalid_credentials'
  | 'invalid_request'
  | 'network_error'
  | 'session_expired'
  | 'unauthorized'
  | 'unknown_error'

export interface ApiErrorPayload {
  error: {
    code: string
    message: string
  }
}
