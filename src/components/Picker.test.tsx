import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TRANSLATIONS, getBook } from '../lib/bible'
import { emptyRecord, type Progress } from '../lib/memory'
import { setDevice } from '../test-setup'
import { BookPicker, TranslationPicker } from './Picker'

const known = { ...emptyRecord(), box: 3 }

const progress: Progress = {
  'BSB:EPH:1:1': known,
  'BSB:EPH:1:2': known,
  'BSB:ROM:8:1': emptyRecord(),
  'KJV:PSA:23:1': known,
}

const onPick = vi.fn()

beforeEach(() => {
  onPick.mockClear()
})

const renderBooks = () => {
  render(<BookPicker book={getBook('EPH')} translation="BSB" progress={progress} onPick={onPick} />)
  return { user: userEvent.setup(), trigger: screen.getByRole('button', { name: 'Book: Ephesians' }) }
}

const renderVersions = () => {
  render(<TranslationPicker translation="BSB" progress={progress} onPick={onPick} />)
  return { user: userEvent.setup(), trigger: screen.getByRole('button', { name: 'Translation: BSB' }) }
}

const option = (name: string | RegExp) => screen.getByRole('option', { name })

describe('BookPicker', () => {
  it('stays closed until asked', () => {
    renderBooks()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens every book at once, with the search ready', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    expect(screen.getAllByRole('option')).toHaveLength(66)
    expect(screen.getByRole('combobox')).toHaveFocus()
    expect(option(/^Ephesians/)).toHaveAttribute('aria-selected', 'true')
  })

  it('opens from the b key', async () => {
    const { user } = renderBooks()
    await user.keyboard('b')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('ignores the b key while another field is being typed in', async () => {
    const { user } = renderBooks()
    render(<input aria-label="other" />)
    await user.click(screen.getByLabelText('other'))
    await user.keyboard('b')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ignores the b key with a modifier held', async () => {
    const { user } = renderBooks()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('leaves the keyboard down on touch screens', async () => {
    setDevice(false)
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    expect(screen.getByRole('listbox')).toHaveFocus()
  })

  it('fades the books that do not match, in place', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('phil')
    expect(screen.getAllByRole('option')).toHaveLength(66)
    expect(option('Philippians')).not.toHaveClass('faint')
    expect(option('Philemon')).not.toHaveClass('faint')
    expect(option('Genesis')).toHaveClass('faint')
  })

  it('walks only the matches with the arrow keys', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('phil{ArrowDown}{Enter}')
    expect(onPick).toHaveBeenCalledExactlyOnceWith('PHM', undefined)
  })

  it('goes straight to a typed chapter', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('rom 8')
    expect(screen.getByText(/Romans 8/)).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(onPick).toHaveBeenCalledExactlyOnceWith('ROM', 8)
  })

  it('stops at the last chapter of the book', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('psalm 999{Enter}')
    expect(onPick).toHaveBeenCalledExactlyOnceWith('PSA', 150)
  })

  it('keeps your place when the current book is picked again', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('{Enter}')
    expect(onPick).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.click(trigger)
    await user.click(option(/^Ephesians/))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('still moves within the current book when a chapter is typed', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('eph 5{Enter}')
    expect(onPick).toHaveBeenCalledExactlyOnceWith('EPH', 5)
  })

  it('picks a clicked book, even a faded one', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('phil')
    await user.click(option('Genesis'))
    expect(onPick).toHaveBeenCalledExactlyOnceWith('GEN', undefined)
  })

  it('does nothing on Enter when no book matches', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('qq{ArrowDown}{Enter}')
    expect(screen.getByText('No book by that name')).toBeInTheDocument()
    expect(onPick).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('types t and b into the search instead of treating them as shortcuts', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('tb')
    expect(screen.getByRole('combobox')).toHaveValue('tb')
  })

  it.each(['{Escape}', '{Tab}'])('closes on %s and hands focus back', async (key) => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard(key)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes on a second press of the trigger', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.click(trigger)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on a tap outside', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.click(document.querySelector('.pick-scrim')!)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('keeps Escape from reaching the page behind it', async () => {
    const onWindow = vi.fn()
    window.addEventListener('keydown', onWindow)
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    await user.keyboard('{Escape}')
    window.removeEventListener('keydown', onWindow)
    expect(onWindow).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }))
  })

  it('counts verses by heart for this translation only', async () => {
    const { user, trigger } = renderBooks()
    await user.click(trigger)
    expect(within(option(/^Ephesians/)).getByText('2')).toBeInTheDocument()
    expect(option('Romans').querySelector('small')).toBeNull()
    expect(option('Psalms').querySelector('small')).toBeNull()
  })
})

describe('TranslationPicker', () => {
  it('opens from the t key on the current translation', async () => {
    const { user } = renderVersions()
    await user.keyboard('t')
    expect(screen.getByRole('listbox')).toHaveFocus()
    expect(option(/^BSB/)).toHaveClass('active', 'on')
  })

  it('picks at once from a number key', async () => {
    const { user, trigger } = renderVersions()
    await user.click(trigger)
    await user.keyboard('2')
    expect(onPick).toHaveBeenCalledExactlyOnceWith('NIV')
    expect(trigger).toHaveFocus()
  })

  it('numbers only the rows a single key can reach', async () => {
    const { user, trigger } = renderVersions()
    await user.click(trigger)
    const hints = screen.getAllByRole('option').map((row) => row.querySelector('kbd')?.textContent)
    expect(hints.slice(0, 9)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    expect(hints.slice(9).filter(Boolean)).toEqual([])
  })

  it('ignores a number with no translation', async () => {
    const { user, trigger } = renderVersions()
    await user.click(trigger)
    await user.keyboard('0')
    expect(onPick).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('wraps round with the arrow keys', async () => {
    const { user, trigger } = renderVersions()
    await user.click(trigger)
    const toTop = Array(TRANSLATIONS.findIndex((t) => t.id === 'BSB') + 1).fill('{ArrowUp}').join('')
    await user.keyboard(`${toTop}{Enter}`)
    expect(onPick).toHaveBeenCalledExactlyOnceWith('GNV')
  })

  it('does not open the book picker from inside the list', async () => {
    render(<BookPicker book={getBook('EPH')} translation="BSB" progress={progress} onPick={onPick} />)
    const { user, trigger } = renderVersions()
    await user.click(trigger)
    await user.keyboard('b')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('counts verses by heart per translation', async () => {
    const { user, trigger } = renderVersions()
    await user.click(trigger)
    expect(option(/^BSB/).querySelector('small')).toHaveTextContent('2')
    expect(option(/^KJV/).querySelector('small')).toHaveTextContent('1')
    expect(option(/^ESV/).querySelector('small')).toBeNull()
  })
})
