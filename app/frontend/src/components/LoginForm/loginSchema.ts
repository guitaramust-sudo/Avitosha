import { z } from 'zod'

export const loginSchema = z.object({
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
    .max(128, 'Пароль должен содержать не более 128 символов.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
