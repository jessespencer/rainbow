import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { chapterName, fetchChapter, getTranslation, type Book, type Verse } from '../lib/bible'
import type { Progress } from '../lib/memory'
import { gradeVerse, whereRound, type PlaceGrade } from '../lib/where'
import { Back } from './Back'
import { Footnotes } from './Footnotes'

interface WhereIsItProps {
  book: Book
  translation: string
  progress: Progress
  onExit: () => void
}

interface Answer {
  grade: PlaceGrade
  // The number tapped, and whether it was a chapter or a verse.
  step: 'chapter' | 'verse'
  guess: number
}

const RIGHT_MS = 900
const TYPING_MS = 700

const NOTES: Record<PlaceGrade, string> = {
  right: '',
  close: 'One verse away.',
  miss: 'It will come round again.',
}

export const WhereIsIt = ({ book, translation, progress, onExit }: WhereIsItProps) => {
  const [queue, setQueue] = useState(() => whereRound(progress, translation, book.code))
  const [index, setIndex] = useState(0)
  const [text, setText] = useState<{ chapter: number; verses: Verse[] }>()
  const [loadError, setLoadError] = useState('')
  // A book of one chapter has only the verse to find.
  const [inChapter, setInChapter] = useState(book.chapters === 1)
  const [answer, setAnswer] = useState<Answer>()
  const [typed, setTyped] = useState('')
  const [tally, setTally] = useState({ right: 0, close: 0, asked: 0 })
  const graded = useRef(new Set<string>())
  const timer = useRef(0)
  const place = queue[index] as (typeof queue)[number] | undefined
  const loaded = !!place && text?.chapter === place.chapter
  const verse = loaded ? text.verses.find((v) => v.verse === place.verse) : undefined
  const lastVerse = loaded ? (text.verses[text.verses.length - 1]?.verse ?? 1) : 1
  const step = inChapter ? 'verse' : 'chapter'
  const count = inChapter ? lastVerse : book.chapters

  // A verse can be missing from a translation, and then there is nothing to show.
  if (loaded && !verse) setIndex(index + 1)

  useEffect(() => () => clearTimeout(timer.current), [])

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // One chapter at a time: licensed text may only be held briefly, and each view is reported.
  useEffect(() => {
    if (!place || text?.chapter === place.chapter) return
    let current = true
    fetchChapter(translation, book, place.chapter)
      .then((verses) => current && setText({ chapter: place.chapter, verses }))
      .catch((e: Error) => current && setLoadError(e.message || 'This translation needs a key. Add yours on the page.'))
    return () => {
      current = false
    }
  }, [place, text, translation, book])

  const advance = () => {
    clearTimeout(timer.current)
    setAnswer(undefined)
    setInChapter(book.chapters === 1)
    setIndex(index + 1)
  }

  const finish = (grade: PlaceGrade, guess: number) => {
    setAnswer({ grade, step, guess })
    const key = `${place!.chapter}:${place!.verse}`
    if (!graded.current.has(key)) {
      graded.current.add(key)
      setTally((t) => ({
        right: t.right + (grade === 'right' ? 1 : 0),
        close: t.close + (grade === 'close' ? 1 : 0),
        asked: t.asked + 1,
      }))
    }
    if (grade === 'miss') setQueue([...queue, place!])
    if (grade === 'right') timer.current = window.setTimeout(advance, RIGHT_MS)
  }

  const choose = (n: number) => {
    if (!place || !verse || answer) return
    clearTimeout(timer.current)
    setTyped('')
    if (step === 'verse') return finish(gradeVerse(place.verse, n), n)
    if (n === place.chapter) setInChapter(true)
    else finish('miss', n)
  }

  // A number is taken as soon as no further digit could follow it.
  const press = (digit: string) => {
    const next = Number(typed + digit)
    if (!next || next > count) return
    clearTimeout(timer.current)
    if (next * 10 > count) return choose(next)
    setTyped(String(next))
    timer.current = window.setTimeout(() => choose(next), TYPING_MS)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onExit()
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || answer || !verse) return
      if (e.key === 'Enter' && typed) {
        e.preventDefault()
        choose(Number(typed))
      } else if (/^\d$/.test(e.key)) press(e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const restart = () => {
    graded.current.clear()
    setQueue(whereRound(progress, translation, book.code))
    setIndex(0)
    setInChapter(book.chapters === 1)
    setTally({ right: 0, close: 0, asked: 0 })
  }

  if (loadError) {
    return (
      <main className="session">
        <p className="session-message">{loadError}</p>
        <button type="button" className="quiet" onClick={onExit}>
          Back to the page
        </button>
      </main>
    )
  }

  if (!place) {
    const misses = tally.asked - tally.right - tally.close
    return (
      <main className="session session-end">
        <p className="fleuron">❦</p>
        <h1>{misses ? 'Nearly held.' : 'It holds.'}</h1>
        <p className="session-message">
          {tally.right} of {tally.asked} at the first asking
          {tally.close > 0 && `, ${tally.close} within a verse`}.
        </p>
        <button type="button" className="primary" onClick={onExit}>
          Back to the page
        </button>
        <button type="button" className="quiet" onClick={restart}>
          Another round
        </button>
      </main>
    )
  }

  const cellState = (n: number) => {
    if (!answer) return n === Number(typed) ? 'where-typed' : ''
    if (answer.step !== step) return ''
    const correct = step === 'verse' ? place.verse : place.chapter
    if (n === correct) return 'quiz-right'
    return n === answer.guess ? 'quiz-miss' : 'quiz-other'
  }

  const credited = getTranslation(translation)
  const name = step === 'verse' ? 'Verse' : 'Chapter'

  return (
    <main className="session session-where">
      <header className="session-head">
        <Back to={book.name} onClick={onExit} />
        <h1 className="session-ref">Where is it?</h1>
        <span className="session-count">
          {translation} · {index + 1} of {queue.length}
        </span>
      </header>
      <div className="ladder ladder-solo">the place</div>
      <section className="stage">
        {verse ? (
          <div className="where" key={index}>
            <blockquote className="where-verse">{verse.text}</blockquote>
            {answer ? (
              <div className="where-answer" role="status">
                <p className="quiz-prompt">
                  {book.name} {place.chapter}:{place.verse}
                </p>
                {answer.grade !== 'right' && (
                  <div className="stage-tools">
                    <span className="again-note">{NOTES[answer.grade]}</span>
                    <button type="button" className="primary" autoFocus onClick={advance}>
                      Continue
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="quiz-lead" aria-live="polite">
                {step === 'verse' && book.chapters > 1 && `Chapter ${chapterName(book, place.chapter)}. `}Which {name.toLowerCase()}?
              </p>
            )}
            <div className="where-grid" key={step} role="group" aria-label={name}>
              {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cellState(n)}
                  aria-label={`${name} ${n}`}
                  disabled={!!answer}
                  onClick={() => choose(n)}
                >
                  {step === 'chapter' ? chapterName(book, n) : n}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="session-message">Opening the book…</p>
        )}
      </section>
      <footer className="session-hint">
        {book.chapters > 1 ? 'Find its chapter, then its verse.' : 'Find its verse.'}
        {credited.links?.map((link) => (
          <span key={link.url}>
            {' '}
            <a href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </span>
        ))}
        {credited.creditOnRecitals && <p className="session-credit">{credited.credit}</p>}
        {answer && verse && <Footnotes verses={[verse]} />}
      </footer>
    </main>
  )
}
