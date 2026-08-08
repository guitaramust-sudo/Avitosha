import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import FrequentlyAskedQuestions from './FrequentlyAskedQuestions'

describe('FrequentlyAskedQuestions', () => {
  it('открывает изначально свёрнутый ответ по клику', async () => {
    const user = userEvent.setup()

    render(<FrequentlyAskedQuestions />)

    const question = screen.getByText('Как выполнять задания?')
    const item = question.closest('details')

    expect(item).not.toHaveAttribute('open')

    await user.click(question)

    expect(item).toHaveAttribute('open')
  })
})
