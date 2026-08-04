import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Введите email.')
      .max(320, 'Email не должен быть длиннее 320 символов.')
      .email('Введите корректный email.'),
    password: z
      .string()
      .min(1, 'Введите пароль.')
      .min(8, 'Пароль должен содержать минимум 8 символов.')
      .max(128, 'Пароль не должен быть длиннее 128 символов.')
      .refine((password) => password.trim().length > 0, 'Введите пароль.'),
    confirmPassword: z.string().min(1, 'Повторите пароль.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают.',
  })

export type RegisterFormValues = z.infer<typeof registerSchema>
