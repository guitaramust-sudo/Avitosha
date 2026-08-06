import { describe, expect, it } from 'vitest'

import { petRenameSchema } from './petRenameSchema'

describe('petRenameSchema', () => {
  it.each(['Мурзик', 'Белый Бим', 'Иван-Царевич', 'Ёжик'])(
    'accepts the supported name %s',
    (name) => {
      expect(petRenameSchema.safeParse({ name }).success).toBe(true)
    },
  )

  it('lets the backend normalize extra spaces and spaces around a hyphen', () => {
    expect(petRenameSchema.safeParse({ name: 'БЕЛЫЙ   БИМ' }).success).toBe(
      true,
    )
    expect(petRenameSchema.safeParse({ name: 'иван - царевич' }).success).toBe(
      true,
    )
  })

  it.each(['Murzик', 'Кот1', 'К', 'ОченьОченьОченьДлинноеИмя'])(
    'rejects the unsupported name %s',
    (name) => {
      expect(petRenameSchema.safeParse({ name }).success).toBe(false)
    },
  )
})
