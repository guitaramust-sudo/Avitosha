import { describe, expect, it } from 'vitest'

import { registerSchema } from './registerSchema'

describe('registerSchema', () => {
  it('accepts credentials matching the backend DTO', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })

    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'different-password',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        'Пароли не совпадают.',
      )
    }
  })

  it('validates email and backend password length', () => {
    const result = registerSchema.safeParse({
      email: 'invalid-email',
      password: 'short',
      confirmPassword: 'short',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors

      expect(errors.email).toContain('Введите корректный email.')
      expect(errors.password).toContain(
        'Пароль должен содержать минимум 8 символов.',
      )
    }
  })
})
