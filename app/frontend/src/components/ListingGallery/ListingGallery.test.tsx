import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ListingGallery from './ListingGallery'

describe('ListingGallery', () => {
  it('switches photos locally and updates the alt text', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ListingGallery
          photoUrls={['/first.jpg', '/second.jpg', '/third.jpg']}
          title="Стеллаж для книг"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByAltText('Стеллаж для книг — фото 1 из 3'),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Следующая фотография' }),
    )
    expect(
      screen.getByAltText('Стеллаж для книг — фото 2 из 3'),
    ).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('hides navigation for a single photo', () => {
    render(
      <MemoryRouter>
        <ListingGallery photoUrls={['/only.jpg']} title="Кресло" />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('button', { name: 'Следующая фотография' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument()
  })
})
