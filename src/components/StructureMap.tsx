import { useEffect } from 'react'
import type { Book } from '../lib/bible'
import { inkLevel, isDue, type Progress } from '../lib/memory'
import {
  outlineSections,
  sectionHeld,
  sectionLabel,
  sectionRecords,
  type Outline,
  type Section,
} from '../lib/outline'

interface StructureMapProps {
  book: Book
  outline: Outline
  translation: string
  progress: Progress
  recall: Progress
  theme: 'light' | 'dark'
  onTheme: () => void
  onBack: () => void
  onRecite: (section: Section) => void
  onQuiz: () => void
}

export const StructureMap = (props: StructureMapProps) => {
  const { book, outline, translation, progress, recall, theme } = props
  const sections = outlineSections(outline)
  const records = sections.flatMap((s) => sectionRecords(outline, s, translation, progress))
  const kept = records.filter((r) => r?.box).length
  const held = sections.filter((s) => sectionHeld(outline, s, recall)).length

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onBack()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const row = (section: Section) => {
    const verses = sectionRecords(outline, section, translation, progress)
    const levels = verses.map(inkLevel)
    const ink = Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length)
    const known = verses.filter((r) => r?.box).length
    const isHeld = sectionHeld(outline, section, recall)
    const label = `Recite ${section.name}, ${book.name} ${sectionLabel(section)}. ${known} of ${verses.length} verses by heart${isHeld ? ', and its place in the order held' : ''}.`
    return (
      <li key={section.id}>
        <button type="button" className="map-row" aria-label={label} onClick={() => props.onRecite(section)}>
          <span className={`map-number ${isHeld ? 'held' : ''}`}>{sections.indexOf(section) + 1}</span>
          <span className={`map-name ink-${ink}`}>{section.name}</span>
          <span className="map-dots">
            {verses.map((record, i) => (
              <i key={i} className={`ink-${inkLevel(record)} ${isDue(record) ? 'due' : ''}`} />
            ))}
          </span>
          <span className="map-ref">{sectionLabel(section)}</span>
        </button>
      </li>
    )
  }

  return (
    <div className="page map">
      <header className="masthead">
        <button type="button" className="wordmark" onClick={props.onBack}>
          By Heart
        </button>
        <button type="button" className="quiet" onClick={props.onBack}>
          Back to the page
        </button>
        <button type="button" className="quiet theme" onClick={props.onTheme} aria-label="Switch between day and night">
          {theme === 'light' ? '☾' : '☼'}
        </button>
      </header>

      <section className="map-hero">
        <p className="map-kicker">The structure of</p>
        <h1>{book.name}</h1>
        <p className="tally">
          <strong>{kept}</strong> of {records.length} verses by heart · <strong className="rubric">{held}</strong> of{' '}
          {sections.length} sections in their place
        </p>
        <div className="hero-actions">
          <button type="button" className="primary" onClick={props.onQuiz}>
            What comes next?
          </button>
        </div>
      </section>

      {outline.parts.map((part) => (
        <section key={part.name} className="map-part">
          <h2>
            {part.name} <span>{part.chapters}</span>
          </h2>
          <ol>{part.sections.map(row)}</ol>
        </section>
      ))}

      <footer className="colophon">
        <p>
          Tap a section to recite it. Each dot is a verse, printed darker as you learn it ({translation}). A numeral
          turns {theme === 'light' ? 'red' : 'gold'} once you know where its section belongs.
        </p>
      </footer>
    </div>
  )
}
