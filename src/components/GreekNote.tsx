import { useEffect, useRef, type CSSProperties } from 'react'
import type { GreekData, GreekTag, GreekWord } from '../lib/greek'

interface GreekNoteProps {
  data: GreekData
  tag: GreekTag
  reference: string
  anchor: HTMLElement
  onGo: (ref: string) => void
  onClose: () => void
}

// Past this a list of verses stops being a hook and becomes a concordance.
const MAX_LISTED = 14

const orJoin = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}` : items[0])

interface EntryProps {
  word: GreekWord
  data: GreekData
  reference: string
  onGo: (ref: string) => void
}

const Entry = ({ word, data, reference, onGo }: EntryProps) => {
  const lemma = data.lemmas[word.lemma]
  const elsewhere = lemma.refs.filter((ref) => ref !== reference)
  return (
    <section className="note-entry">
      <p className="note-greek" lang="grc">
        {word.form ?? word.lemma}
      </p>
      <p className="note-translit">{word.form ? word.translit : lemma.translit}</p>
      <p className="note-gloss">
        {word.form && word.form !== word.lemma && (
          <>
            from{' '}
            <span className="greek" lang="grc">
              {word.lemma}
            </span>
            ,{' '}
          </>
        )}
        <em>{lemma.gloss.replaceAll('/', ', ')}</em>
      </p>
      {word.literal && word.literal !== lemma.gloss && <p className="note-small">Word for word: {word.literal}</p>}
      {word.parse && <p className="note-small">{word.parse}</p>}
      {word.forms && (
        <p className="note-small">
          This verse has it as{' '}
          <span className="greek" lang="grc">
            {orJoin(word.forms)}
          </span>
          . The tag does not say which stands here.
        </p>
      )}
      {elsewhere.length > 0 && (
        <p className="note-small note-places">
          {elsewhere.length > MAX_LISTED ? (
            `In ${lemma.refs.length} verses of Ephesians.`
          ) : (
            <>
              Also at{' '}
              {elsewhere.map((ref, i) => (
                <span key={ref}>
                  {i > 0 && ' '}
                  <button type="button" className="link" onClick={() => onGo(ref)}>
                    {ref}
                  </button>
                </span>
              ))}
            </>
          )}
        </p>
      )}
    </section>
  )
}

export const GreekNote = ({ data, tag, reference, anchor, onGo, onClose }: GreekNoteProps) => {
  const note = useRef<HTMLElement>(null)

  // At the foot of a phone screen the note can land on the very word it explains.
  useEffect(() => {
    const sheet = note.current!
    if (getComputedStyle(sheet).position !== 'fixed') return
    const covered = anchor.getBoundingClientRect().bottom + 16 - sheet.getBoundingClientRect().top
    if (covered > 0) window.scrollBy({ top: covered, behavior: 'smooth' })
  }, [anchor])

  return (
    <aside ref={note} className="note" style={{ '--note-top': `${anchor.offsetTop}px` } as CSSProperties} aria-live="polite">
      <header className="note-head">
        <span>{reference}</span>
        <button type="button" className="quiet close" onClick={onClose} aria-label="Close the note">
          ×
        </button>
      </header>
      {tag.greek.map((word) => (
        <Entry key={word.lemma} word={word} data={data} reference={reference} onGo={onGo} />
      ))}
    </aside>
  )
}
