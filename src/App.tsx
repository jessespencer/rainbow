import { useCallback, useEffect, useState } from 'react'
import { PageView } from './components/PageView'
import { Session, type SessionItem } from './components/Session'
import { getBook } from './lib/bible'
import { emptyRecord, loadProgress, saveProgress, type Progress, type VerseRecord } from './lib/memory'

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
  const book = getBook(place.book)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('byheart.theme', theme)
  }, [theme])

  useEffect(() => localStorage.setItem(placeStore, JSON.stringify(place)), [place])
  useEffect(() => saveProgress(progress), [progress])

  const updateRecord = useCallback((key: string, update: (record: VerseRecord) => VerseRecord) => {
    setProgress((current) => ({ ...current, [key]: update(current[key] ?? emptyRecord()) }))
  }, [])

  const leaveSession = useCallback(() => setSession(undefined), [])

  if (session) {
    return (
      <Session
        items={session}
        book={book}
        translation={place.translation}
        progress={progress}
        onRecord={updateRecord}
        onExit={leaveSession}
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
      onBook={(code) => setPlace({ ...place, book: code, chapter: 1 })}
      onChapter={(chapter) => setPlace({ ...place, chapter })}
      onTranslation={(translation) => setPlace({ ...place, translation })}
      onTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      onStart={setSession}
    />
  )
}
