export type ApiErrorCode =
  | 'email_already_exists'
  | 'internal_error'
  | 'invalid_credentials'
  | 'invalid_request'
  | 'invalid_pet_name'
  | 'network_error'
  | 'session_expired'
  | 'unauthorized'
  | 'forbidden_pet_name'
  | 'unknown_error'

export interface ApiErrorPayload {
  error: {
    code: string
    message: string
  }
}
