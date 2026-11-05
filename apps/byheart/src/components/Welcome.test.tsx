import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Welcome } from './Welcome'

const onBegin = vi.fn()

beforeEach(() => {
  onBegin.mockClear()
})

const renderWelcome = () => {
  render(<Welcome book="EPH" translation="BSB" onBegin={onBegin} />)
  return {
    user: userEvent.setup(),
    book: screen.getByRole('button', { name: /^Book:/ }),
    translation: screen.getByRole('button', { name: /^Translation:/ }),
    begin: screen.getByRole('button', { name: 'Open the book' }),
  }
}

describe('Welcome', () => {
  it('begins with the suggested book and translation', async () => {
    const { user, begin } = renderWelcome()
    await user.click(begin)
    expect(onBegin).toHaveBeenCalledExactlyOnceWith('EPH', 'BSB', 1)
  })

  it('spells out the translation for someone who may not know the letters', () => {
    const { translation } = renderWelcome()
    expect(translation).toHaveTextContent('Berean Standard Bible')
  })

  it('begins with the book and translation picked', async () => {
    const { user, book, translation, begin } = renderWelcome()
    await user.click(book)
    await user.keyboard('john{Enter}')
    await user.click(translation)
    await user.keyboard('1')
    await user.click(begin)
    expect(onBegin).toHaveBeenCalledExactlyOnceWith('JHN', 'ESV', 1)
  })

  it('carries a typed chapter through, and shows it', async () => {
    const { user, book, begin } = renderWelcome()
    await user.click(book)
    await user.keyboard('rom 8{Enter}')
    expect(book).toHaveTextContent('Romans 8')
    await user.click(begin)
    expect(onBegin).toHaveBeenCalledExactlyOnceWith('ROM', 'BSB', 8)
  })

  it('drops the chapter when another book is picked', async () => {
    const { user, book, begin } = renderWelcome()
    await user.click(book)
    await user.keyboard('rom 8{Enter}')
    await user.click(book)
    await user.keyboard('gen{Enter}')
    await user.click(begin)
    expect(onBegin).toHaveBeenCalledExactlyOnceWith('GEN', 'BSB', 1)
  })

  it('does not submit the form when Enter picks from a list', async () => {
    const { user, book, translation } = renderWelcome()
    await user.click(book)
    await user.keyboard('mark{Enter}')
    await user.click(translation)
    await user.keyboard('{Enter}')
    expect(onBegin).not.toHaveBeenCalled()
  })

  it('warns when the chosen translation needs a key', async () => {
    const { user, translation } = renderWelcome()
    expect(screen.queryByText(/needs a free key/)).not.toBeInTheDocument()
    await user.click(translation)
    await user.keyboard('1')
    expect(screen.getByText(/The ESV needs a free key/)).toBeInTheDocument()
  })
})
