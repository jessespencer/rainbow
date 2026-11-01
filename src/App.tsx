import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PageView } from './components/PageView'
import { Session, type SessionItem } from './components/Session'
import { StructureMap } from './components/StructureMap'
import { StructureQuiz } from './components/StructureQuiz'
import { getBook } from './lib/bible'
import { revealFrom, withTransition } from './lib/motion'
import { emptyRecord, loadProgress, saveProgress, type Progress, type VerseRecord } from './lib/memory'
import {
  gradeStructure,
  loadStructureRecall,
  outlineOf,
  saveStructureRecall,
  sectionAfter,
  sectionSpans,
  type Section,
} from './lib/outline'

type Theme = 'light' | 'dark'

const placeStore = 'byheart.place'

const loadPlace = () => {
  const fallback = { translation: 'BSB', book: 'EPH', chapter: 1 }
  try {
    return { ...fallback, ...(JSON.parse(localStorage.getItem(placeStore) ?? '{}') as Partial<typeof fallback>) }
  } catch {
    return fallback
  }
}

const initialTheme = (): Theme => {
  const saved = localStorage.getItem('byheart.theme')
  if (saved === 'light' || saved === 'dark') return saved
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const App = () => {
  const [place, setPlace] = useState(loadPlace)
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [session, setSession] = useState<SessionItem[]>()
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [view, setView] = useState<'page' | 'map' | 'quiz'>('page')
  const [section, setSection] = useState<Section>()
  const [recall, setRecall] = useState<Progress>(loadStructureRecall)
  const book = getBook(place.book)
  const outline = outlineOf(book.code)
  const mapScroll = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('byheart.theme', theme)
  }, [theme])

  useEffect(() => localStorage.setItem(placeStore, JSON.stringify(place)), [place])
  useEffect(() => saveProgress(progress), [progress])
  useEffect(() => saveStructureRecall(recall), [recall])

  const updateRecord = useCallback((key: string, update: (record: VerseRecord) => VerseRecord) => {
    setProgress((current) => ({ ...current, [key]: update(current[key] ?? emptyRecord()) }))
  }, [])

  // Coming back from a recital or the quiz lands on the row you left, not the top.
  useLayoutEffect(() => {
    if (!session) window.scrollTo(0, view === 'map' ? mapScroll.current : 0)
  }, [session, view])

  const leaveSession = useCallback(() => withTransition('screen', () => setSession(undefined)), [])
  const leaveQuiz = useCallback(() => withTransition('screen', () => setView('map')), [])

  const gradeQuestion = useCallback((key: string, clean: boolean) => {
    setRecall((current) => ({ ...current, [key]: gradeStructure(current[key], clean) }))
  }, [])

  const reciteSection = (chosen: Section) => {
    mapScroll.current = window.scrollY
    withTransition('screen', () => {
      setSection(chosen)
      setSession(sectionSpans(outline!, chosen).map((span) => ({ kind: 'run', ...span })))
    })
  }

  if (session) {
    const sectionRun = view === 'map' && section && {
      name: section.name,
      onNext: sectionAfter(outline!, section) && (() => {
        withTransition('screen', () => {
          setSession(undefined)
          setView('quiz')
        })
      }),
    }
    return (
      <Session
        items={session}
        book={book}
        translation={place.translation}
        progress={progress}
        onRecord={updateRecord}
        onExit={leaveSession}
        section={sectionRun || undefined}
      />
    )
  }

  if (view === 'quiz' && outline) {
    return (
      <StructureQuiz
        book={book}
        outline={outline}
        recall={recall}
        focus={section}
        onGrade={gradeQuestion}
        onExit={leaveQuiz}
      />
    )
  }

  if (view === 'map' && outline) {
    return (
      <StructureMap
        book={book}
        outline={outline}
        translation={place.translation}
        progress={progress}
        recall={recall}
        theme={theme}
        onBack={() => withTransition('screen', () => setView('page'))}
        onRecite={reciteSection}
        onQuiz={() => {
          mapScroll.current = window.scrollY
          withTransition('screen', () => {
            setSection(undefined)
            setView('quiz')
          })
        }}
      />
    )
  }

  return (
    <PageView
      book={book}
      chapter={place.chapter}
      translation={place.translation}
      progress={progress}
      theme={theme}
      onBook={(code) => {
        setPlace({ ...place, book: code, chapter: 1 })
        setView('page')
      }}
      onChapter={(chapter) => setPlace({ ...place, chapter })}
      onTranslation={(translation) => setPlace({ ...place, translation })}
      onTheme={(origin) => revealFrom(origin, () => setTheme(theme === 'light' ? 'dark' : 'light'))}
      onStart={(items) => withTransition('screen', () => setSession(items))}
      onMap={
        outline &&
        (() => {
          mapScroll.current = 0
          withTransition('screen', () => setView('map'))
        })
      }
    />
  )
}
