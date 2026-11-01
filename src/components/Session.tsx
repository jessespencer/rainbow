import { useEffect, useMemo, useState } from 'react'
import { fetchChapter, refLabel, type Book, type Verse } from '../lib/bible'
import {
  LADDER,
  STAGE_HINTS,
  emptyRecord,
  gradeRecall,
  isDue,
  verseKey,
  type Progress,
  type Stage,
  type VerseRecord,
} from '../lib/memory'
import { pickBlanks, senseLines, tokenize } from '../lib/text'
import { PassageText, type Reveal } from './PassageText'
import { OrderStage, ReciteStage, TypedStage, VanishStage, canSpeak } from './stages'

export interface SessionItem {
  kind: 'learn' | 'review' | 'run'
  chapter: number
  from: number
  to: number
}

interface SessionProps {
  items: SessionItem[]
  book: Book
  translation: string
  progress: Progress
  onRecord: (key: string, update: (record: VerseRecord) => VerseRecord) => void
  onExit: () => void
}

const REVEALS: Partial<Record<Stage, Reveal>> = {
  trace: 'ghost',
  initials: 'initial',
  shapes: 'shape',
  bare: 'blank',
  thread: 'blank',
}

const RUN_STAGE = 7
const FLOURISH_MS = 1100

export const Session = ({ items, book, translation, progress, onRecord, onExit }: SessionProps) => {
  const [index, setIndex] = useState(0)
  const [chapterText, setChapterText] = useState<{ chapter: number; verses: Verse[] }>()
  const [loadError, setLoadError] = useState('')
  const item = items[index] as SessionItem | undefined
  const firstKey = item ? verseKey(translation, book.code, item.chapter, item.from) : ''
  const startStage = (it: SessionItem | undefined, key: string): Stage =>
    it?.kind === 'learn' ? LADDER[Math.min(progress[key]?.stage ?? 0, 6)] : 'bare'
  const [stage, setStage] = useState<Stage>(startStage(item, firstKey))
  const [attempt, setAttempt] = useState(0)
  const [flourish, setFlourish] = useState<'pass' | 'again'>()
  const [speaking, setSpeaking] = useState(false)
  const [tally, setTally] = useState({ verses: 0, stumbles: 0 })

  useEffect(() => {
    if (!item || chapterText?.chapter === item.chapter) return
    let current = true
    fetchChapter(translation, book, item.chapter)
      .then((verses) => current && setChapterText({ chapter: item.chapter, verses }))
      .catch((e: Error) => current && setLoadError(e.message))
    return () => {
      current = false
    }
  }, [item, chapterText, translation, book])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onExit()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  const verses = useMemo(() => {
    if (!item || chapterText?.chapter !== item.chapter) return []
    return chapterText.verses.filter((v) => v.verse >= item.from && v.verse <= item.to)
  }, [item, chapterText])

  const previousVerse = useMemo(() => {
    if (!item || !chapterText || item.kind !== 'learn') return undefined
    const before = chapterText.verses.find((v) => v.verse === item.from - 1)
    const known = before && (progress[verseKey(translation, book.code, before.chapter, before.verse)]?.box ?? 0) > 0
    return known ? before : undefined
  }, [item, chapterText, progress, translation, book])

  const practised = useMemo(
    () => (stage === 'thread' && previousVerse ? [previousVerse, ...verses] : verses),
    [stage, previousVerse, verses],
  )
  const tokens = useMemo(() => tokenize(practised.map((v) => v.text)), [practised])
  const lines = useMemo(() => senseLines(tokens), [tokens])
  const seed = `${firstKey}:${stage}`
  const targets = useMemo(() => {
    if (stage !== 'blanks') return tokens.map((t) => t.id)
    const blanks = pickBlanks(tokens, seed)
    return tokens.filter((t) => blanks.has(t.id)).map((t) => t.id)
  }, [tokens, stage, seed])

  const record = (verse: number, update: (r: VerseRecord) => VerseRecord) =>
    onRecord(verseKey(translation, book.code, item!.chapter, verse), update)

  const nextItem = () => {
    const next = items[index + 1]
    setIndex(index + 1)
    setAttempt(0)
    setSpeaking(false)
    if (next) setStage(startStage(next, verseKey(translation, book.code, next.chapter, next.from)))
  }

  const afterFlourish = (action: () => void, kind: 'pass' | 'again' = 'pass') => {
    setFlourish(kind)
    setTimeout(() => {
      setFlourish(undefined)
      action()
    }, FLOURISH_MS)
  }

  const finishLearnStage = (passed: boolean) => {
    if (!passed) return afterFlourish(() => setAttempt(attempt + 1), 'again')
    const position = LADDER.indexOf(stage)
    if (stage === 'bare') {
      record(item!.from, (r) => (r.box === 0 ? gradeRecall({ ...r, stage: RUN_STAGE }, true) : r))
      setTally((t) => ({ ...t, verses: t.verses + 1 }))
    } else if (stage !== 'thread') {
      record(item!.from, (r) => ({ ...r, stage: Math.max(r.stage, position + 1) }))
    }
    const threadNext = stage === 'bare' && previousVerse
    if (stage === 'bare' && !threadNext) return afterFlourish(nextItem)
    if (stage === 'thread') return afterFlourish(nextItem)
    afterFlourish(() => {
      setStage(LADDER[position + 1])
      setAttempt(0)
      setSpeaking(false)
    })
  }

  const finishTyped = (helped: Set<number>) => {
    const share = helped.size / Math.max(1, targets.length)
    if (item!.kind === 'learn') return finishLearnStage(stage === 'trace' || share <= 0.2)

    if (item!.kind === 'review') {
      if (stage === 'shapes') return afterFlourish(nextItem)
      const clean = helped.size <= Math.floor(tokens.length / 20)
      record(item!.from, (r) => gradeRecall(r, clean))
      setTally((t) => ({ verses: t.verses + (clean ? 1 : 0), stumbles: t.stumbles + (clean ? 0 : 1) }))
      if (clean) return afterFlourish(nextItem)
      return afterFlourish(() => {
        setStage('shapes')
        setSpeaking(false)
      }, 'again')
    }

    // A run grades every verse it crossed, so it doubles as a placement test: verses
    // you already know skip the ladder entirely.
    let clean = 0
    let stumbles = 0
    verses.forEach((verse, verseIndex) => {
      const own = tokens.filter((t) => t.verseIndex === verseIndex)
      const misses = own.filter((t) => helped.has(t.id)).length
      const ok = misses <= Math.floor(own.length / 20)
      if (ok) clean += 1
      else stumbles += 1
      const existing = progress[verseKey(translation, book.code, verse.chapter, verse.verse)] ?? emptyRecord()
      if (ok && existing.box > 0 && !isDue(existing)) return
      if (!ok && existing.box === 0) return
      record(verse.verse, (r) => gradeRecall({ ...r, stage: Math.max(r.stage, ok ? RUN_STAGE : r.stage) }, ok))
    })
    setTally((t) => ({ verses: t.verses + clean, stumbles: t.stumbles + stumbles }))
    afterFlourish(nextItem)
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

  if (!item) {
    return (
      <main className="session session-end">
        <p className="fleuron">❦</p>
        <h1>It is written.</h1>
        <p className="session-message">
          {tally.verses === 1 ? 'One verse' : `${tally.verses} verses`} kept
          {tally.stumbles > 0 && `, ${tally.stumbles} to come back to tomorrow`}.
        </p>
        <button type="button" className="primary" onClick={onExit}>
          Back to the page
        </button>
      </main>
    )
  }

  const verseNumbers = practised.length > 1 ? practised.map((v) => v.verse) : undefined
  const reveal = REVEALS[stage]
  const speakable = (stage === 'bare' || stage === 'thread') && canSpeak()

  const renderStage = () => {
    if (!tokens.length) return <p className="session-message">Opening the book…</p>
    if (flourish === 'pass') {
      return (
        <div className="flourish">
          <PassageText lines={lines} reveal="blank" stateOf={() => 'plain'} verseNumbers={verseNumbers} />
          <p className="fleuron">❦</p>
        </div>
      )
    }
    if (flourish === 'again') {
      return (
        <div className="flourish flourish-again">
          <PassageText lines={lines} reveal="blank" stateOf={() => 'plain'} verseNumbers={verseNumbers} />
          <p className="again-note">Look it over once more.</p>
        </div>
      )
    }
    const stageKey = `${index}-${stage}-${attempt}`
    if (stage === 'order') {
      return <OrderStage key={stageKey} lines={lines} onDone={(misses) => finishLearnStage(misses <= lines.length)} />
    }
    if (stage === 'vanish') {
      return <VanishStage key={stageKey} tokens={tokens} lines={lines} seed={seed} onDone={() => finishLearnStage(true)} />
    }
    if (speaking) {
      return (
        <ReciteStage
          key={stageKey}
          tokens={tokens}
          lines={lines}
          verseNumbers={verseNumbers}
          onDone={finishTyped}
          onCancel={() => setSpeaking(false)}
        />
      )
    }
    return (
      <TypedStage
        key={stageKey}
        tokens={tokens}
        lines={lines}
        reveal={reveal ?? 'blank'}
        targets={targets}
        verseNumbers={verseNumbers}
        onDone={finishTyped}
        onSpeak={speakable ? () => setSpeaking(true) : undefined}
      />
    )
  }

  const reference = refLabel(book, verses.length ? verses : [{ chapter: item.chapter, verse: item.from, text: '' }])
  const ladder = LADDER.filter((s) => s !== 'thread' || previousVerse)

  return (
    <main className={`session session-${stage}`}>
      <header className="session-head">
        <button type="button" className="quiet close" onClick={onExit} aria-label="Leave and return to the page">
          ×
        </button>
        <h1 className="session-ref">{reference}</h1>
        <span className="session-count">
          {translation}
          {items.length > 1 && ` · ${index + 1} of ${items.length}`}
        </span>
      </header>
      {item.kind === 'learn' ? (
        <nav className="ladder" aria-label="Memorizing stages">
          {ladder.map((s) => (
            <button
              key={s}
              type="button"
              className={s === stage ? 'on' : ''}
              aria-current={s === stage ? 'step' : undefined}
              onClick={() => {
                setStage(s)
                setSpeaking(false)
                setAttempt(attempt + 1)
              }}
            >
              {s}
            </button>
          ))}
        </nav>
      ) : (
        <div className="ladder ladder-solo">{item.kind === 'run' ? 'recite' : stage === 'shapes' ? 'shapes' : 'review'}</div>
      )}
      <section className="stage">{renderStage()}</section>
      <footer className="session-hint">
        {item.kind === 'run' ? 'First letter of every word. Two misses and the word is given to you.' : STAGE_HINTS[stage]}
        {translation === 'ESV' && (
          <>
            {' '}
            <a href="https://www.esv.org" target="_blank" rel="noreferrer">
              ESV.org
            </a>
          </>
        )}
      </footer>
    </main>
  )
}
