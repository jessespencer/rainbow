import { useEffect, useState, type CSSProperties } from 'react'
import {
  MissingKeyError,
  chapterName,
  fetchChapter,
  getKey,
  getTranslation,
  setKey,
  type Book,
  type Translation,
  type Verse,
} from '../lib/bible'
import { hasGreek, loadGreek, splitVerse, type GreekData, type GreekTag } from '../lib/greek'
import { inkLevel, isDue, verseKey, type Progress } from '../lib/memory'
import { prefersStillness } from '../lib/motion'
import { Backup } from './Backup'
import { FleuronMark } from './Fleuron'
import { Footnotes } from './Footnotes'
import { GreekNote } from './GreekNote'
import { BookPicker, TranslationPicker } from './Picker'
import type { SessionItem } from './Session'

interface PageViewProps {
  book: Book
  chapter: number
  translation: string
  progress: Progress
  theme: 'light' | 'dark'
  onBook: (code: string, chapter?: number) => void
  onChapter: (chapter: number) => void
  onTranslation: (id: string) => void
  onTheme: (origin: HTMLElement) => void
  onStart: (items: SessionItem[]) => void
  onMap?: () => void
  onWhere?: () => void
}

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
  const [greekOn, setGreekOn] = useState(false)
  const [greek, setGreek] = useState<GreekData>()
  const [opened, setOpened] = useState<{ id: string; tag: GreekTag; ref: string; anchor: HTMLElement }>()
  const [found, setFound] = useState<{ chapter: number; verse: number }>()
  const pageId = `${translation}:${book.code}:${chapter}:${keyAttempt}`
  const selection = chosen?.id === pageId ? chosen.range : undefined
  const verses = loaded?.id === pageId ? loaded.verses : []
  const problem = failure?.id === pageId ? failure : undefined
  const opening = !verses.length && !problem
  const greekReady = hasGreek(translation, book.code) && greekOn ? greek : undefined
  const note = greekReady && opened?.id === pageId ? opened : undefined

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

  useEffect(() => {
    if (greekOn && !greek) loadGreek().then(setGreek)
  }, [greekOn, greek])

  useEffect(() => {
    if (found?.chapter !== chapter || !loaded || loaded.id !== pageId) return
    document.getElementById(`verse-${found.verse}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [found, chapter, loaded, pageId])

  useEffect(() => {
    if (!note) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpened(undefined)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [note])

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

  const toggleGreek = () => {
    setGreekOn(!greekOn)
    setChosen(undefined)
    setOpened(undefined)
    setFound(undefined)
  }

  const openWord = (tag: GreekTag, verse: number, anchor: HTMLElement) => {
    const same = note?.tag === tag
    setOpened(same ? undefined : { id: pageId, tag, ref: `${chapter}:${verse}`, anchor })
  }

  const goToVerse = (ref: string) => {
    const [target, verse] = ref.split(':').map(Number)
    setOpened(undefined)
    setFound({ chapter: target, verse })
    if (target !== chapter) props.onChapter(target)
  }

  const greekPieces = (v: Verse) => {
    const tagged = greekReady?.verses[`${chapter}:${v.verse}`]
    return tagged && splitVerse(v.text, tagged)
  }
  const untagged = greekReady ? verses.filter((v) => !greekPieces(v)).length : 0

  const chapterCount = (n: number) => kept.filter(([key]) => parseKey(key).chapter === n).length
  const lastVerse = verses[verses.length - 1]?.verse ?? 1
  const credited = getTranslation(translation)
  const titleStyle = { '--letters': Math.max(book.name.length, 8) } as CSSProperties

  return (
    <div className="page">
      <header className="masthead">
        <span className="wordmark">
          <FleuronMark />
          By Heart
        </span>
        <BookPicker book={book} translation={translation} progress={progress} onPick={props.onBook} />
        <TranslationPicker translation={translation} progress={progress} onPick={props.onTranslation} />
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
          {props.onWhere && (
            <button type="button" className="quiet" onClick={props.onWhere}>
              Where is it?
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
        <KeyForm translation={credited} message={problem.message} onSaved={() => setKeyAttempt(keyAttempt + 1)} />
      ) : problem ? (
        <p className="session-message">{problem.message}</p>
      ) : (
        <article className={`leaf ${greekReady ? 'leaf-greek' : ''}`} key={loaded?.id}>
          {hasGreek(translation, book.code) && verses.length > 0 && (
            <p className="greek-switch">
              <button type="button" className={`quiet ${greekOn ? 'on' : ''}`} aria-pressed={greekOn} onClick={toggleGreek}>
                Greek
              </button>
              {greekReady && <span> Tap a dotted word to see the Greek behind it.</span>}
            </p>
          )}
          <span className="drop" aria-hidden="true">
            {chapterName(book, chapter)}
          </span>
          {verses.map((v) => {
            const record = recordOf(v.verse)
            const chosen = selection && v.verse >= selection[0] && v.verse <= selection[1]
            const inkClasses = `verse ink-${inkLevel(record)} ${isDue(record) ? 'due' : ''}`
            if (greekReady) {
              const arrived = found?.chapter === chapter && found.verse === v.verse
              return (
                <span key={v.verse} id={`verse-${v.verse}`} className={`${inkClasses} ${arrived ? 'found' : ''}`}>
                  {v.verse > 1 && <sup>{v.verse}</sup>}
                  {(greekPieces(v) ?? [{ text: v.text }]).map((piece, i) =>
                    piece.tag ? (
                      <GreekWordSpan
                        key={i}
                        text={piece.text}
                        open={note?.tag === piece.tag}
                        onOpen={(anchor) => openWord(piece.tag!, v.verse, anchor)}
                      />
                    ) : (
                      piece.text
                    ),
                  )}{' '}
                </span>
              )
            }
            return (
              <span
                key={v.verse}
                role="button"
                tabIndex={0}
                className={`${inkClasses} ${chosen ? 'chosen' : ''}`}
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
          <Footnotes verses={verses} />
          {greekReady && note && (
            <GreekNote
              data={greekReady}
              tag={note.tag}
              reference={note.ref}
              anchor={note.anchor}
              onGo={goToVerse}
              onClose={() => setOpened(undefined)}
            />
          )}
        </article>
      )}

      <footer className="colophon">
        <p>Unlearned verses are printed in grey. They darken as you learn them.</p>
        {untagged > 0 && (
          <p>
            Greek is hidden for {untagged === 1 ? 'one verse' : `${untagged} verses`} here: the wording differs from the
            edition the tags were made for.
          </p>
        )}
        {hasGreek(translation, book.code) && (
          <p>
            Greek text, grammar and glosses from{' '}
            <a href="https://www.STEPBible.org" target="_blank" rel="noreferrer">
              STEP Bible
            </a>{' '}
            (TAGNT, TBESG, TEGMC; CC BY 4.0). ESV word tags by{' '}
            <a href="https://www.TyndaleHouse.com" target="_blank" rel="noreferrer">
              Tyndale House, Cambridge
            </a>{' '}
            and STEP Bible (
            <a href="https://STEPBible.github.io/STEPBible-Data/" target="_blank" rel="noreferrer">
              TTESV
            </a>
            ; CC BY-NC 4.0), corrected against the ESV and limited to words of meaning. The tags name a Greek word, not an
            interpretation.
          </p>
        )}
        {credited.credit ? (
          <p>
            {credited.credit}
            {credited.links?.map((link) => (
              <span key={link.url}>
                {' '}
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </span>
            ))}
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
        <Backup />
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

interface GreekWordSpanProps {
  text: string
  open: boolean
  onOpen: (anchor: HTMLElement) => void
}

const GreekWordSpan = ({ text, open, onOpen }: GreekWordSpanProps) => (
  <span
    role="button"
    tabIndex={0}
    aria-pressed={open}
    className={`g ${open ? 'on' : ''}`}
    onClick={(e) => onOpen(e.currentTarget)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen(e.currentTarget)
      }
    }}
  >
    {text}
  </span>
)

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

interface KeyFormProps {
  translation: Translation
  message: string
  onSaved: () => void
}

const KeyForm = ({ translation, message, onSaved }: KeyFormProps) => {
  const [value, setValue] = useState(getKey(translation))
  const source = translation.keySource!
  return (
    <form
      className="key-form"
      onSubmit={(e) => {
        e.preventDefault()
        setKey(translation, value)
        onSaved()
      }}
    >
      <h2>The {translation.id} needs a key</h2>
      <p>
        {message || `${source.lender} lends this text out one key at a time.`} Create a free one at{' '}
        <a href={source.url} target="_blank" rel="noreferrer">
          {source.site}
        </a>{' '}
        and paste it here. It stays in this browser, which then talks to {source.lender} directly.
      </p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your API key"
        aria-label={`${translation.id} API key`}
        autoComplete="off"
        spellCheck={false}
      />
      <button type="submit" className="primary" disabled={!value.trim()}>
        Open the {translation.id}
      </button>
    </form>
  )
}
