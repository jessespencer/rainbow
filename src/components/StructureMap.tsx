import { useEffect, type CSSProperties } from 'react'
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
import { Back } from './Back'

interface StructureMapProps {
  book: Book
  outline: Outline
  translation: string
  progress: Progress
  recall: Progress
  onBack: () => void
  onRecite: (section: Section) => void
  onQuiz: () => void
}

export const StructureMap = (props: StructureMapProps) => {
  const { book, outline, translation, progress, recall } = props
  const sections = outlineSections(outline)
  const held = sections.filter((s) => sectionHeld(outline, s, recall)).length

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
    const position = sections.indexOf(section)
    const label = `Recite ${section.name}, ${book.name} ${sectionLabel(section)}. ${known} of ${verses.length} verses by heart${isHeld ? ', and its place in the order held' : ''}.`
    return (
      <li key={section.id} style={{ '--row': position } as CSSProperties}>
        <button type="button" className="map-row" aria-label={label} onClick={() => props.onRecite(section)}>
          <span className={`map-number ${isHeld ? 'held' : ''}`}>{position + 1}</span>
          <span className={`map-name ink-${ink}`}>{section.name}</span>
          <span className="map-dots">
            {verses.map((record, i) => (
              <i
                key={i}
                className={`ink-${inkLevel(record)} ${isDue(record) ? 'due' : ''}`}
                style={{ '--dot': i } as CSSProperties}
              />
            ))}
          </span>
          <span className="map-ref">{sectionLabel(section)}</span>
        </button>
      </li>
    )
  }

  return (
    <main className="map">
      <header className="session-head">
        <Back to={book.name} onClick={props.onBack} />
        <h1 className="session-ref">The structure of {book.name}</h1>
        <span className="session-count">{translation}</span>
      </header>

      <div className="map-head">
        <p className="tally">
          <strong className="rubric">{held}</strong> of {sections.length} sections in their place
        </p>
        <button type="button" className="primary" onClick={props.onQuiz}>
          What comes next?
        </button>
      </div>

      {outline.parts.map((part) => (
        <section key={part.name} className="map-part">
          <h2>
            {part.name} <span>{part.chapters}</span>
          </h2>
          <ol>{part.sections.map(row)}</ol>
        </section>
      ))}

      <p className="map-note">
        Tap a section to recite it. Each dot is a verse, printed darker as you learn it. A numeral lights up once you
        know where its section belongs.
      </p>
    </main>
  )
}
