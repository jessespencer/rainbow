export type Stage = 'trace' | 'order' | 'blanks' | 'vanish' | 'initials' | 'shapes' | 'bare' | 'thread'

export const LADDER: Stage[] = ['trace', 'order', 'blanks', 'vanish', 'initials', 'shapes', 'bare', 'thread']

export const STAGE_HINTS: Record<Stage, string> = {
  trace: 'Read it aloud, typing the first letter of every word.',
  order: 'Put the lines back in order.',
  blanks: 'Type the first letter of each missing word.',
  vanish: 'Say it aloud, then let some of it go.',
  initials: 'Only the first letters remain. Type your way through.',
  shapes: 'Only the shape of the words remains.',
  bare: 'Nothing on the page. Write it from the heart.',
  thread: 'Now tie it to the verse before. The seams are what slip.',
}

export interface VerseRecord {
  stage: number
  box: number
  due: string
  lapses: number
}

export type Progress = Record<string, VerseRecord>

const INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120, 240]
const progressStore = 'byheart.progress'

export const loadProgress = (): Progress => {
  try {
    return JSON.parse(localStorage.getItem(progressStore) ?? '{}') as Progress
  } catch {
    return {}
  }
}

export const saveProgress = (progress: Progress) =>
  localStorage.setItem(progressStore, JSON.stringify(progress))

export const verseKey = (translation: string, book: string, chapter: number, verse: number) =>
  `${translation}:${book}:${chapter}:${verse}`

export const today = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const addDays = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return today(d)
}

export const emptyRecord = (): VerseRecord => ({ stage: 0, box: 0, due: '', lapses: 0 })

export const isDue = (r: VerseRecord | undefined) => !!r && r.box > 0 && r.due <= today()

// A clean recall moves a verse up a box and roughly doubles the wait. A stumble brings
// it back tomorrow, but never drops it to the bottom of the ladder.
export const gradeRecall = (record: VerseRecord, clean: boolean): VerseRecord => {
  if (clean) {
    const box = Math.min(record.box + 1, INTERVALS.length - 1)
    return { ...record, box, due: addDays(INTERVALS[box]) }
  }
  const box = Math.max(1, record.box - 2)
  return { ...record, box, due: addDays(1), lapses: record.lapses + 1 }
}

// How dark a verse is printed on the page. Unlearned text is a ghost; it inks in as it
// climbs the ladder, then keeps darkening through the review boxes.
export const inkLevel = (r: VerseRecord | undefined) => {
  if (!r) return 0
  if (r.box === 0) return Math.min(r.stage, 5)
  return Math.min(5 + r.box, 10)
}
