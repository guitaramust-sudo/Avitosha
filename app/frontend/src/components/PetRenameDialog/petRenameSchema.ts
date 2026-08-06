import { z } from 'zod'

export const petRenameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Имя должно содержать минимум 2 символа.')
    .max(20, 'Имя не должно быть длиннее 20 символов.')
    .regex(
      /^[А-Яа-яЁё]+(?:[ -]+[А-Яа-яЁё]+)*$/,
      'Используйте только русские буквы, пробел или дефис.',
    ),
})

export type PetRenameFormValues = z.infer<typeof petRenameSchema>
