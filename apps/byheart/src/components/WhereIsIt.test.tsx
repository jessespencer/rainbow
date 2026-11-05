import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBook, type Verse } from '../lib/bible'
import { emptyRecord, type Progress } from '../lib/memory'
import { WhereIsIt } from './WhereIsIt'

const fetchChapter = vi.hoisted(() => vi.fn())

vi.mock('../lib/bible', async (original) => ({
  ...(await original<typeof import('../lib/bible')>()),
  fetchChapter,
}))

const known = { ...emptyRecord(), box: 3 }
const onExit = vi.fn()

const chapterOf = (chapter: number, length: number): Verse[] =>
  Array.from({ length }, (_, i) => ({ chapter, verse: i + 1, text: `Words of ${chapter}:${i + 1}.` }))

const renderDrill = async (progress: Progress = { 'BSB:EPH:2:8': known }, code = 'EPH') => {
  render(<WhereIsIt book={getBook(code)} translation="BSB" progress={progress} onExit={onExit} />)
  await screen.findByRole('group')
  return userEvent.setup()
}

const button = (name: string) => screen.getByRole('button', { name })

beforeEach(() => {
  onExit.mockClear()
  fetchChapter.mockReset()
  fetchChapter.mockImplementation(async (_: string, __: unknown, chapter: number) => chapterOf(chapter, 22))
})

describe('WhereIsIt', () => {
  it('shows the verse without its reference', async () => {
    await renderDrill()
    expect(screen.getByText('Words of 2:8.')).toBeInTheDocument()
    expect(screen.queryByText(/Ephesians 2:8/)).not.toBeInTheDocument()
  })

  it('offers every chapter in the numerals of the page', async () => {
    await renderDrill()
    expect(button('Chapter 6')).toHaveTextContent('VI')
    expect(screen.getAllByRole('button', { name: /^Chapter/ })).toHaveLength(6)
  })

  it('asks for the verse once the chapter is right', async () => {
    const user = await renderDrill()
    await user.click(button('Chapter 2'))
    expect(screen.getByText(/Chapter II\. Which verse\?/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Verse/ })).toHaveLength(22)
  })

  it('ends the question on a wrong chapter and brings it round again', async () => {
    const user = await renderDrill()
    await user.click(button('Chapter 3'))
    expect(screen.getByText('Ephesians 2:8')).toBeInTheDocument()
    expect(screen.getByText('It will come round again.')).toBeInTheDocument()
    expect(screen.getByText(/1 of 2/)).toBeInTheDocument()
    await user.click(button('Continue'))
    expect(screen.getByText(/2 of 2/)).toBeInTheDocument()
    expect(screen.getByText('Words of 2:8.')).toBeInTheDocument()
  })

  it('calls one verse off close, and does not ask again', async () => {
    const user = await renderDrill()
    await user.click(button('Chapter 2'))
    await user.click(button('Verse 9'))
    expect(screen.getByText('One verse away.')).toBeInTheDocument()
    await user.click(button('Continue'))
    expect(screen.getByRole('heading', { name: 'It holds.' })).toBeInTheDocument()
    expect(screen.getByText('0 of 1 at the first asking, 1 within a verse.')).toBeInTheDocument()
  })

  it('moves on by itself after a right answer', async () => {
    const user = await renderDrill()
    await user.click(button('Chapter 2'))
    await user.click(button('Verse 8'))
    expect(screen.getByText('Ephesians 2:8')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()
    expect(await screen.findByText('1 of 1 at the first asking.', {}, { timeout: 2000 })).toBeInTheDocument()
  })

  it('counts only the first answer when a miss comes round', async () => {
    const user = await renderDrill()
    await user.click(button('Chapter 1'))
    await user.click(button('Continue'))
    await user.click(button('Chapter 2'))
    await user.click(button('Verse 8'))
    expect(await screen.findByText('0 of 1 at the first asking.', {}, { timeout: 2000 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nearly held.' })).toBeInTheDocument()
  })

  it('answers from the number keys, waiting for a second digit', async () => {
    const user = await renderDrill({ 'BSB:EPH:2:12': known })
    await user.keyboard('2')
    await user.keyboard('12')
    expect(screen.getByText('Ephesians 2:12')).toBeInTheDocument()
  })

  it('takes a lone digit on Enter', async () => {
    const user = await renderDrill()
    await user.keyboard('2')
    await user.keyboard('8{Enter}')
    expect(screen.getByText('Ephesians 2:8')).toBeInTheDocument()
  })

  it('goes straight to the verse in a book of one chapter', async () => {
    await renderDrill({ 'BSB:JUD:1:3': known }, 'JUD')
    expect(screen.queryByRole('button', { name: /^Chapter/ })).not.toBeInTheDocument()
    expect(screen.getByText('Which verse?')).toBeInTheDocument()
  })

  it('skips a verse this translation does not have', async () => {
    fetchChapter.mockImplementation(async (_: string, __: unknown, chapter: number) => chapterOf(chapter, 5))
    render(<WhereIsIt book={getBook('EPH')} translation="BSB" progress={{ 'BSB:EPH:2:8': known }} onExit={onExit} />)
    expect(await screen.findByRole('heading', { name: 'It holds.' })).toBeInTheDocument()
  })

  it('fetches only the chapter it is asking about', async () => {
    await renderDrill()
    expect(fetchChapter).toHaveBeenCalledTimes(1)
    expect(fetchChapter).toHaveBeenCalledWith('BSB', expect.anything(), 2)
  })

  it('says so when the chapter cannot be reached', async () => {
    fetchChapter.mockRejectedValue(new Error('Could not reach Ephesians 2.'))
    render(<WhereIsIt book={getBook('EPH')} translation="BSB" progress={{ 'BSB:EPH:2:8': known }} onExit={onExit} />)
    expect(await screen.findByText('Could not reach Ephesians 2.')).toBeInTheDocument()
  })

  it('leaves on Escape', async () => {
    const user = await renderDrill()
    await user.keyboard('{Escape}')
    expect(onExit).toHaveBeenCalledOnce()
  })
})
