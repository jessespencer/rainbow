import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { BOOKS, TRANSLATIONS, findBooks, getTranslation, type Book } from '../lib/bible'
import type { Progress } from '../lib/memory'

const kept = (progress: Progress) =>
  Object.entries(progress)
    .filter(([, record]) => record.box > 0)
    .map(([key]) => key.split(':'))

const countBy = (values: string[]) => {
  const counts: Record<string, number> = {}
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1
  return counts
}

// A phone keyboard would cover the list it is meant to search, so touch has to ask for it.
const canType = () => matchMedia('(hover: hover) and (pointer: fine)').matches

const showRow = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ block: 'nearest' })
}

interface PickerProps {
  label: string
  value: string
  hotkey: string
  panel: string
  children: (close: () => void) => ReactNode
}

const Picker = ({ label, value, hotkey, panel, children }: PickerProps) => {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }

  // Caught on the way down, so it works wherever focus has wandered and the page never sees it.
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== hotkey || e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as Element).closest('input, textarea, .pick-panel')) return
      e.preventDefault()
      trigger.current?.scrollIntoView({ block: 'nearest' })
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotkey])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="pick-trigger"
        aria-label={`${label}: ${value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-keyshortcuts={hotkey}
        onClick={() => setOpen(!open)}
      >
        <span>{value}</span>
        <svg viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <>
          <div className="pick-scrim" onClick={close} />
          <div className={`pick-panel ${panel}`}>{children(close)}</div>
        </>
      )}
    </>
  )
}

interface BookPickerProps {
  book: Book
  // Shown beside the name when a place past the first chapter is chosen but not yet open.
  chapter?: number
  translation: string
  progress: Progress
  onPick: (code: string, chapter?: number) => void
}

export const BookPicker = (props: BookPickerProps) => (
  <Picker
    label="Book"
    value={props.chapter && props.chapter > 1 ? `${props.book.name} ${props.chapter}` : props.book.name}
    hotkey="b"
    panel="pick-books"
  >
    {(close) => <Contents {...props} onClose={close} />}
  </Picker>
)

const optionId = (book: Book) => `pick-book-${book.code}`

const TESTAMENTS = [
  { name: 'The Old Testament', books: BOOKS.slice(0, 39) },
  { name: 'The New Testament', books: BOOKS.slice(39) },
]

const Contents = ({ book, translation, progress, onPick, onClose }: BookPickerProps & { onClose: () => void }) => {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(book)
  const field = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const searching = query.trim().length > 0
  const { matches, best, chapter } = findBooks(query)
  const target = matches.includes(active) ? active : undefined
  const counts = countBy(kept(progress).flatMap(([id, code]) => (id === translation ? [code] : [])))

  useEffect(() => {
    showRow(optionId(book))
    ;(canType() ? field.current : list.current)?.focus({ preventScroll: true })
  }, [book])

  const pick = (chosen: Book) => {
    onClose()
    // The book you are already in keeps your place unless a chapter was asked for.
    if (chosen !== book || chapter) onPick(chosen.code, chapter && Math.min(chapter, chosen.chapters))
  }

  const move = (next?: Book) => {
    if (!next) return
    setActive(next)
    showRow(optionId(next))
  }

  // Columns reflow by width, so the book beside this one is found by where it landed.
  const across = (direction: 1 | -1) => {
    const place = (b: Book) => document.getElementById(optionId(b))!.getBoundingClientRect()
    const here = place(active)
    const beside = matches
      .map((b) => ({ b, column: (place(b).left - here.left) * direction, row: Math.abs(place(b).top - here.top) }))
      .filter(({ column }) => column > 1)
      .sort((x, y) => x.column - y.column || x.row - y.row)
    move(beside[0]?.b)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const at = target ? matches.indexOf(target) : -1
    const steps: Record<string, () => void> = {
      ArrowDown: () => move(matches[at + 1]),
      ArrowUp: () => move(matches[at - 1]),
      Enter: () => target && pick(target),
      Tab: onClose,
      ...(!searching && { ArrowRight: () => across(1), ArrowLeft: () => across(-1) }),
    }
    if (!steps[e.key]) return
    e.preventDefault()
    e.stopPropagation()
    steps[e.key]()
  }

  const follow = (e: PointerEvent, b: Book) => {
    if (e.pointerType === 'mouse' && b !== active) setActive(b)
  }

  return (
    <div onKeyDown={onKeyDown}>
      <div className="pick-find">
        <input
          ref={field}
          role="combobox"
          aria-label="Find a book"
          aria-expanded="true"
          aria-controls="pick-book-list"
          aria-autocomplete="list"
          aria-activedescendant={target && optionId(target)}
          value={query}
          placeholder="Find a book or chapter, like Romans 8"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value)
            const found = findBooks(e.target.value)
            if (e.target.value.trim()) {
              if (found.best) setActive(found.best)
            } else setActive(book)
          }}
        />
        <span className="pick-goes" aria-live="polite">
          {!searching ? (
            <kbd className="pick-esc" aria-hidden="true">
              esc
            </kbd>
          ) : target ? (
            <>
              {target.name}
              {chapter && ` ${Math.min(chapter, target.chapters)}`} <kbd aria-hidden="true">↵</kbd>
            </>
          ) : (
            'No book by that name'
          )}
        </span>
      </div>
      <div ref={list} id="pick-book-list" className="pick-contents" role="listbox" aria-label="Book" tabIndex={-1}>
        {TESTAMENTS.map((testament) => (
          <div key={testament.name} role="group" aria-label={testament.name} className="pick-testament">
            <div className="pick-head" aria-hidden="true">
              {testament.name}
            </div>
            {testament.books.map((b) => (
              <div
                key={b.code}
                id={optionId(b)}
                role="option"
                aria-selected={b === book}
                className={`pick-row ${b === target ? 'active' : ''} ${b === book ? 'on' : ''} ${
                  searching && !matches.includes(b) ? 'faint' : ''
                } ${searching && b === best ? 'best' : ''}`}
                onPointerMove={(e) => follow(e, b)}
                onClick={() => pick(b)}
              >
                <span>{b.name}</span>
                {counts[b.code] > 0 && <small>{counts[b.code]}</small>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface TranslationPickerProps {
  translation: string
  progress: Progress
  spelledOut?: boolean
  onPick: (id: string) => void
}

export const TranslationPicker = (props: TranslationPickerProps) => (
  <Picker
    label="Translation"
    value={props.spelledOut ? getTranslation(props.translation).name : props.translation}
    hotkey="t"
    panel="pick-versions"
  >
    {(close) => <Versions {...props} onClose={close} />}
  </Picker>
)

const Versions = ({ translation, progress, onPick, onClose }: TranslationPickerProps & { onClose: () => void }) => {
  const [active, setActive] = useState(Math.max(0, TRANSLATIONS.findIndex((t) => t.id === translation)))
  const list = useRef<HTMLDivElement>(null)
  const counts = countBy(kept(progress).map(([id]) => id))

  // Effects return only cleanups, and scrollIntoView now returns a promise, so these keep their braces.
  useEffect(() => {
    list.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    showRow(`pick-version-${TRANSLATIONS[active].id}`)
  }, [active])

  const pick = (index: number) => {
    onClose()
    onPick(TRANSLATIONS[index].id)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const steps: Record<string, () => void> = {
      ArrowDown: () => setActive((active + 1) % TRANSLATIONS.length),
      ArrowUp: () => setActive((active - 1 + TRANSLATIONS.length) % TRANSLATIONS.length),
      Enter: () => pick(active),
      Tab: onClose,
    }
    const numbered = TRANSLATIONS[Number(e.key) - 1] && (() => pick(Number(e.key) - 1))
    const step = steps[e.key] ?? numbered
    if (!step) return
    e.preventDefault()
    e.stopPropagation()
    step()
  }

  return (
    <div
      ref={list}
      role="listbox"
      aria-label="Translation"
      aria-activedescendant={`pick-version-${TRANSLATIONS[active].id}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {TRANSLATIONS.map((t, i) => (
        <div
          key={t.id}
          id={`pick-version-${t.id}`}
          role="option"
          aria-selected={t.id === translation}
          className={`pick-version ${i === active ? 'active' : ''} ${t.id === translation ? 'on' : ''}`}
          onPointerMove={(e) => e.pointerType === 'mouse' && setActive(i)}
          onClick={() => pick(i)}
        >
          <kbd aria-hidden="true">{i < 9 && i + 1}</kbd>
          <strong>{t.id}</strong>
          <span>{t.name}</span>
          {counts[t.id] > 0 && <small>{counts[t.id]}</small>}
        </div>
      ))}
    </div>
  )
}
