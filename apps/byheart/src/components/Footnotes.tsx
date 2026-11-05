import type { Verse } from '../lib/bible'

interface FootnotesProps {
  verses: Verse[]
}

export const Footnotes = ({ verses }: FootnotesProps) => {
  const notes = verses.flatMap((v) => v.notes ?? [])
  if (!notes.length) return null
  return (
    <details className="footnotes">
      <summary>Footnotes</summary>
      <ol>
        {notes.map((note, i) => (
          <li key={i}>{note}</li>
        ))}
      </ol>
    </details>
  )
}
