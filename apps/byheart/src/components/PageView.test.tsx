import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getBook, type Verse } from '../lib/bible'
import { PageView } from './PageView'

const fetchChapter = vi.hoisted(() => vi.fn())

vi.mock('../lib/bible', async (original) => ({
  ...(await original<typeof import('../lib/bible')>()),
  fetchChapter,
}))

const onStart = vi.fn()

const chapterIn = (translation: string): Verse[] =>
  Array.from({ length: 3 }, (_, i) => ({ chapter: 1, verse: i + 1, text: `${translation} words of 1:${i + 1}.` }))

// A load that waits until the test lets it finish.
const held = () => {
  let finish: (verses: Verse[]) => void = () => {}
  const promise = new Promise<Verse[]>((resolve) => (finish = resolve))
  return { promise, finish }
}

const page = (translation: string) => (
  <PageView
    book={getBook('EPH')}
    chapter={1}
    translation={translation}
    progress={{}}
    theme="dark"
    onBook={() => {}}
    onChapter={() => {}}
    onTranslation={() => {}}
    onTheme={() => {}}
    onStart={onStart}
  />
)

const leaf = () => document.querySelector('.leaf')!

beforeEach(() => {
  onStart.mockClear()
  fetchChapter.mockReset()
  fetchChapter.mockImplementation(async (translation: string) => chapterIn(translation))
})

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'startViewTransition')
})

describe('PageView', () => {
  it('keeps the last translation printed while the next one loads', async () => {
    const { rerender } = render(page('BSB'))
    await screen.findByText(/BSB words of 1:1/)

    const next = held()
    fetchChapter.mockReturnValueOnce(next.promise)
    rerender(page('KJV'))

    expect(screen.getByText(/BSB words of 1:1/)).toBeInTheDocument()
    expect(leaf()).toHaveClass('leaf-waiting')

    await act(async () => next.finish(chapterIn('KJV')))
    expect(screen.getByText(/KJV words of 1:1/)).toBeInTheDocument()
    expect(screen.queryByText(/BSB words of 1:1/)).not.toBeInTheDocument()
    expect(leaf()).not.toHaveClass('leaf-waiting')
  })

  it('does not start a session from a page that is still giving way', async () => {
    const { rerender } = render(page('BSB'))
    await screen.findByText(/BSB words of 1:1/)
    fetchChapter.mockReturnValueOnce(held().promise)
    rerender(page('KJV'))

    await userEvent.setup().click(screen.getByRole('button', { name: 'Learn verse 1' }))
    expect(onStart).not.toHaveBeenCalled()
  })

  it('turns to the next page with a view transition, but prints the first one plainly', async () => {
    const startViewTransition = vi.fn((update: () => void) => {
      update()
      return { ready: Promise.resolve(), finished: Promise.resolve() }
    })
    Object.assign(document, { startViewTransition })

    const { rerender } = render(page('BSB'))
    await screen.findByText(/BSB words of 1:1/)
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(leaf()).toHaveClass('leaf-arrive')

    rerender(page('KJV'))
    await screen.findByText(/KJV words of 1:1/)
    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(leaf()).not.toHaveClass('leaf-arrive')
  })
})
