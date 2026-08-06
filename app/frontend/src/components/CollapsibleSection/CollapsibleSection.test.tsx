import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import CollapsibleSection from './CollapsibleSection'

describe('CollapsibleSection', () => {
  it('collapses and expands its content', async () => {
    const user = userEvent.setup()
    render(
      <CollapsibleSection className="test-panel" title="Лидерборд">
        <p>Содержимое лидерборда</p>
      </CollapsibleSection>,
    )

    await user.click(
      screen.getByRole('button', { name: 'Свернуть: Лидерборд' }),
    )
    expect(screen.queryByText('Содержимое лидерборда')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Лидерборд' })).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Развернуть: Лидерборд' }),
    )
    expect(screen.getByText('Содержимое лидерборда')).toBeVisible()
  })
})
