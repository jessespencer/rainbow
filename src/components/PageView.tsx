import { useEffect, useState, type CSSProperties } from 'react'
import { BOOKS, ESV_NOTICE, MissingKeyError, TRANSLATIONS, fetchChapter, getEsvKey, setEsvKey, type Book, type Verse } from '../lib/bible'
import { inkLevel, isDue, verseKey, type Progress } from '../lib/memory'
import { prefersStillness } from '../lib/motion'
import type { SessionItem } from './Session'

interface PageViewProps {
  book: Book
  chapter: number
  translation: string
  progress: Progress
  theme: 'light' | 'dark'
  onBook: (code: string) => void
  onChapter: (chapter: number) => void
  onTranslation: (id: string) => void
  onTheme: (origin: HTMLElement) => void
  onStart: (items: SessionItem[]) => void
  onMap?: () => void
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const chapterName = (book: Book, n: number) => (book.chapters <= 12 ? ROMAN[n - 1] : String(n))

const parseKey = (key: string) => {
  const [, , chapter, verse] = key.split(':')
  return { chapter: Number(chapter), verse: Number(verse) }
}

export const PageView = (props: PageViewProps) => {
  const { book, chapter, translation, progress, theme } = props
  const [loaded, setLoaded] = useState<{ id: string; verses: Verse[] }>()
  const [failure, setFailure] = useState<{ id: string; message: string; needsKey: boolean }>()
  const [chosen, setChosen] = useState<{ id: string; range: [number, number] }>()
  const [keyAttempt, setKeyAttempt] = useState(0)
  const pageId = `${translation}:${book.code}:${chapter}:${keyAttempt}`
  const selection = chosen?.id === pageId ? chosen.range : undefined
  const verses = loaded?.id === pageId ? loaded.verses : []
  const problem = failure?.id === pageId ? failure : undefined
  const opening = !verses.length && !problem

  useEffect(() => {
    let current = true
    fetchChapter(translation, book, chapter)
      .then((v) => {
        if (!current) return
        setLoaded({ id: pageId, verses: v })
        setFailure(undefined)
      })
      .catch((e: Error) => {
        if (current) setFailure({ id: pageId, message: e.message, needsKey: e instanceof MissingKeyError })
      })
    return () => {
      current = false
    }
  }, [translation, book, chapter, pageId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setChosen(undefined)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const prefix = `${translation}:${book.code}:`
  const bookRecords = Object.entries(progress).filter(([key]) => key.startsWith(prefix))
  const kept = bookRecords.filter(([, r]) => r.box > 0)
  const due = bookRecords
    .filter(([, r]) => isDue(r))
    .map(([key]) => parseKey(key))
    .sort((a, b) => a.chapter - b.chapter || a.verse - b.verse)
  const recordOf = (verse: number) => progress[verseKey(translation, book.code, chapter, verse)]
  const nextNew = verses.find((v) => !recordOf(v.verse)?.box)

  const todayItems: SessionItem[] = [
    ...due.map((d) => ({ kind: 'review' as const, chapter: d.chapter, from: d.verse, to: d.verse })),
    ...(nextNew ? [{ kind: 'learn' as const, chapter, from: nextNew.verse, to: nextNew.verse }] : []),
  ]

  const select = (verse: number) => {
    if (!selection) return setChosen({ id: pageId, range: [verse, verse] })
    const [from, to] = selection
    if (verse >= from && verse <= to) return setChosen(undefined)
    setChosen({ id: pageId, range: [Math.min(from, verse), Math.max(to, verse)] })
  }

  const learnSelection = ([from, to]: [number, number]) => {
    props.onStart(
      Array.from({ length: to - from + 1 }, (_, i) => ({ kind: 'learn' as const, chapter, from: from + i, to: from + i })),
    )
  }

  const chapterCount = (n: number) => kept.filter(([key]) => parseKey(key).chapter === n).length
  const lastVerse = verses[verses.length - 1]?.verse ?? 1
  const titleStyle = { '--letters': Math.max(book.name.length, 8) } as CSSProperties

  return (
    <div className="page">
      <header className="masthead">
        <span className="wordmark">By Heart</span>
        <label className="picker">
          <span className="sr-only">Book</span>
          <select value={book.code} onChange={(e) => props.onBook(e.target.value)}>
            {BOOKS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="picker">
          <span className="sr-only">Translation</span>
          <select value={translation} onChange={(e) => props.onTranslation(e.target.value)}>
            {TRANSLATIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} · {t.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="quiet theme" onClick={(e) => props.onTheme(e.currentTarget)} aria-label="Switch between day and night">
          {theme === 'light' ? '☾' : '☼'}
        </button>
      </header>

      <section className="hero">
        <h1 style={titleStyle}>{book.name}</h1>
        <p className="tally">
          <strong>{kept.length}</strong> {kept.length === 1 ? 'verse' : 'verses'} by heart
          {due.length > 0 && (
            <>
              {' '}
              · <strong className="rubric">{due.length}</strong> due today
            </>
          )}
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="primary"
            disabled={!todayItems.length}
            onClick={() => props.onStart(todayItems)}
          >
            {due.length
              ? 'Begin today’s verses'
              : nextNew
                ? `Learn verse ${nextNew.verse}`
                : opening
                  ? 'Opening the book…'
                  : 'Nothing due today'}
          </button>
          <button
            type="button"
            className="quiet"
            disabled={!verses.length}
            onClick={() => props.onStart([{ kind: 'run', chapter, from: 1, to: lastVerse }])}
          >
            Recite chapter {chapter}
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() =>
              props.onStart(
                Array.from({ length: book.chapters }, (_, i) => ({ kind: 'run' as const, chapter: i + 1, from: 1, to: 999 })),
              )
            }
          >
            Recite the book
          </button>
          {props.onMap && (
            <button type="button" className="quiet" aria-label={`The structure of ${book.name}`} onClick={props.onMap}>
              Structure
            </button>
          )}
        </div>
      </section>

      <nav className="chapters" aria-label="Chapters">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={n === chapter ? 'on' : ''}
            aria-current={n === chapter ? 'page' : undefined}
            onClick={() => props.onChapter(n)}
          >
            {chapterName(book, n)}
            {chapterCount(n) > 0 && <small>{chapterCount(n)}</small>}
          </button>
        ))}
      </nav>

      {problem?.needsKey ? (
        <EsvKeyForm message={problem.message} onSaved={() => setKeyAttempt(keyAttempt + 1)} />
      ) : problem ? (
        <p className="session-message">{problem.message}</p>
      ) : (
        <article className="leaf" key={loaded?.id}>
          <span className="drop" aria-hidden="true">
            {chapterName(book, chapter)}
          </span>
          {verses.map((v) => {
            const record = recordOf(v.verse)
            const chosen = selection && v.verse >= selection[0] && v.verse <= selection[1]
            return (
              <span
                key={v.verse}
                role="button"
                tabIndex={0}
                className={`verse ink-${inkLevel(record)} ${isDue(record) ? 'due' : ''} ${chosen ? 'chosen' : ''}`}
                onClick={() => select(v.verse)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    select(v.verse)
                  }
                }}
              >
                {v.verse > 1 && <sup>{v.verse}</sup>}
                {v.text}{' '}
              </span>
            )
          })}
        </article>
      )}

      <footer className="colophon">
        <p>Unlearned verses are printed in grey. They darken as you learn them.</p>
        {translation === 'ESV' ? (
          <p>
            {ESV_NOTICE}{' '}
            <a href="https://www.esv.org" target="_blank" rel="noreferrer">
              ESV.org
            </a>
          </p>
        ) : (
          <p>
            Memorizing in the ESV?{' '}
            <button type="button" className="link" onClick={() => props.onTranslation('ESV')}>
              Add a free key
            </button>
            . {translation} text is in the public domain.
          </p>
        )}
      </footer>

      <VerseSlip
        book={book}
        chapter={chapter}
        selection={selection}
        onLearn={learnSelection}
        onRecite={([from, to]) => props.onStart([{ kind: 'run', chapter, from, to }])}
      />
    </div>
  )
}

interface VerseSlipProps {
  book: Book
  chapter: number
  selection?: [number, number]
  onLearn: (selection: [number, number]) => void
  onRecite: (selection: [number, number]) => void
}

// Holds on to the last selection so the slip can animate away after it is cleared.
const VerseSlip = ({ book, chapter, selection, onLearn, onRecite }: VerseSlipProps) => {
  const [held, setHeld] = useState(selection)
  if (selection && selection !== held) setHeld(selection)
  if (!selection && held && prefersStillness()) setHeld(undefined)
  if (!held) return null
  const leaving = selection ? '' : 'dock-leaving'
  return (
    <>
      <div className={`dock-veil ${leaving}`} aria-hidden="true" />
      <aside
        className={`dock ${leaving}`}
        onAnimationEnd={(e) => {
          if (!selection && e.target === e.currentTarget) setHeld(undefined)
        }}
      >
        <div className="dock-slip">
          <span className="dock-ref">
            {book.name} {chapter}:{held[0]}
            {held[1] !== held[0] && `–${held[1]}`}
          </span>
          <span className="dock-actions">
            <button type="button" className="primary" onClick={() => onLearn(held)}>
              Learn
            </button>
            <button type="button" className="quiet" onClick={() => onRecite(held)}>
              Recite
            </button>
          </span>
        </div>
      </aside>
    </>
  )
}

interface EsvKeyFormProps {
  message: string
  onSaved: () => void
}

const EsvKeyForm = ({ message, onSaved }: EsvKeyFormProps) => {
  const [value, setValue] = useState(getEsvKey())
  return (
    <form
      className="key-form"
      onSubmit={(e) => {
        e.preventDefault()
        setEsvKey(value)
        onSaved()
      }}
    >
      <h2>The ESV needs a key</h2>
      <p>
        {message || 'Crossway lends its text out one key at a time.'} Create a free one at{' '}
        <a href="https://api.esv.org/account/create-application/" target="_blank" rel="noreferrer">
          api.esv.org
        </a>{' '}
        and paste it here. It stays in this browser, which then talks to Crossway directly.
      </p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your API key"
        aria-label="ESV API key"
        autoComplete="off"
        spellCheck={false}
      />
      <button type="submit" className="primary" disabled={!value.trim()}>
        Open the ESV
      </button>
    </form>
  )
}
