import { gradeRecall, loadProgress, saveProgress, today, verseKey, type Progress, type VerseRecord } from './memory'
import { shuffled } from './text'

export interface Section {
  id: string
  name: string
  from: string
  to: string
}

export interface Part {
  name: string
  chapters: string
  sections: Section[]
}

export interface Outline {
  book: string
  // Verses in each chapter, so a section can cross a chapter without loading any text.
  verses: number[]
  parts: Part[]
}

export interface Span {
  chapter: number
  from: number
  to: number
}

// Section names and verse ranges only. An outline must cover its book without gaps,
// since "what comes next?" reads straight down the list. Add a book here to give it a map.
const OUTLINES: Outline[] = [
  {
    book: 'EPH',
    verses: [23, 22, 21, 32, 33, 24],
    parts: [
      {
        name: 'The Calling',
        chapters: 'I–III',
        sections: [
          { id: 'greeting', name: 'Greeting', from: '1:1', to: '1:2' },
          { id: 'blessings', name: 'Blessings', from: '1:3', to: '1:14' },
          { id: 'first-prayer', name: 'First prayer', from: '1:15', to: '1:23' },
          { id: 'grace', name: 'Grace', from: '2:1', to: '2:10' },
          { id: 'peace', name: 'Peace', from: '2:11', to: '2:22' },
          { id: 'mystery', name: 'Mystery', from: '3:1', to: '3:13' },
          { id: 'second-prayer', name: 'Second prayer', from: '3:14', to: '3:21' },
        ],
      },
      {
        name: 'The Conduct',
        chapters: 'IV–VI',
        sections: [
          { id: 'unity', name: 'Unity', from: '4:1', to: '4:16' },
          { id: 'new-self', name: 'New self', from: '4:17', to: '4:32' },
          { id: 'walk', name: 'Walk', from: '5:1', to: '5:21' },
          { id: 'households', name: 'Households', from: '5:22', to: '6:9' },
          { id: 'armor', name: 'Armor', from: '6:10', to: '6:20' },
          { id: 'farewell', name: 'Farewell', from: '6:21', to: '6:24' },
        ],
      },
    ],
  },
]

export const outlineOf = (bookCode: string) => OUTLINES.find((o) => o.book === bookCode)

export const outlineSections = (outline: Outline) => outline.parts.flatMap((p) => p.sections)

const parseRef = (ref: string) => {
  const [chapter, verse] = ref.split(':').map(Number)
  return { chapter, verse }
}

// One span per chapter: a run loads a chapter at a time, so the ESV cap holds however
// far a section reaches.
export const sectionSpans = (outline: Outline, section: Section): Span[] => {
  const first = parseRef(section.from)
  const last = parseRef(section.to)
  return Array.from({ length: last.chapter - first.chapter + 1 }, (_, i) => {
    const chapter = first.chapter + i
    return {
      chapter,
      from: chapter === first.chapter ? first.verse : 1,
      to: chapter === last.chapter ? last.verse : outline.verses[chapter - 1],
    }
  })
}

export const sectionVerses = (outline: Outline, section: Section) =>
  sectionSpans(outline, section).flatMap(({ chapter, from, to }) =>
    Array.from({ length: to - from + 1 }, (_, i) => ({ chapter, verse: from + i })),
  )

const rangeLabel = (from: string, to: string) => {
  if (from === to) return from
  const first = parseRef(from)
  const last = parseRef(to)
  return first.chapter === last.chapter ? `${from}–${last.verse}` : `${from}–${to}`
}

export const sectionLabel = (section: Section) => rangeLabel(section.from, section.to)

export const sectionRecords = (outline: Outline, section: Section, translation: string, progress: Progress) =>
  sectionVerses(outline, section).map(({ chapter, verse }) => progress[verseKey(translation, outline.book, chapter, verse)])

// Knowing the order of a book is separate from knowing its words, so this has its own
// store, keyed by book alone: the shape of Ephesians is the same in every translation.
const recallStore = 'byheart.structure'

export const loadStructureRecall = () => loadProgress(recallStore)

export const saveStructureRecall = (recall: Progress) => saveProgress(recall, recallStore)

const isReady = (r: VerseRecord | undefined) => !r || r.box === 0 || r.due <= today()

// Unlike a verse, a miss here clears the section entirely. Answering early leaves the
// schedule where it was, so a second round in one day cannot rush a section up the boxes.
export const gradeStructure = (record: VerseRecord, clean: boolean): VerseRecord => {
  if (!clean) return { ...gradeRecall(record, false), box: 0 }
  return isReady(record) ? gradeRecall(record, true) : record
}

export type QuestionKind = 'next' | 'place'

export interface Question {
  key: string
  kind: QuestionKind
  prompt: string
  answer: Section
  options: Section[]
}

const questionKey = (outline: Outline, section: Section, kind: QuestionKind) => `${outline.book}:${section.id}:${kind}`

const questionKeys = (outline: Outline, section: Section) => {
  const sections = outlineSections(outline)
  const last = sections[sections.length - 1] === section
  return [questionKey(outline, section, 'place'), ...(last ? [] : [questionKey(outline, section, 'next')])]
}

export const sectionHeld = (outline: Outline, section: Section, recall: Progress) =>
  questionKeys(outline, section).every((key) => (recall[key]?.box ?? 0) > 0)

export const sectionAfter = (outline: Outline, section: Section): Section | undefined => {
  const sections = outlineSections(outline)
  return sections[sections.indexOf(section) + 1]
}

// The wrong answers come from close by, where the order is easiest to confuse.
const optionsFor = (sections: Section[], answer: Section, prompt?: Section) => {
  const at = sections.indexOf(answer)
  const distance = (s: Section) => Math.abs(sections.indexOf(s) - at)
  const near = sections.filter((s) => s !== answer && s !== prompt).sort((a, b) => distance(a) - distance(b))
  return shuffled([answer, ...shuffled(near.slice(0, 5)).slice(0, 3)])
}

// A few verses from inside the section, so the map's own labels are not the answer.
const passageWithin = (outline: Outline, section: Section) => {
  const verses = sectionVerses(outline, section)
  const length = Math.min(verses.length, 1 + Math.floor(Math.random() * 3))
  const start = Math.floor(Math.random() * (verses.length - length + 1))
  const first = verses[start]
  const last = verses[start + length - 1]
  return rangeLabel(`${first.chapter}:${first.verse}`, `${last.chapter}:${last.verse}`)
}

const nextQuestion = (outline: Outline, section: Section): Question => {
  const answer = sectionAfter(outline, section)!
  return {
    key: questionKey(outline, section, 'next'),
    kind: 'next',
    prompt: section.name,
    answer,
    options: optionsFor(outlineSections(outline), answer, section),
  }
}

const placeQuestion = (outline: Outline, section: Section): Question => ({
  key: questionKey(outline, section, 'place'),
  kind: 'place',
  prompt: passageWithin(outline, section),
  answer: section,
  options: optionsFor(outlineSections(outline), section),
})

const ROUND_LENGTH = 8

// Whatever is unseen, missed or due comes first, then whatever would fall due soonest.
export const quizRound = (outline: Outline, recall: Progress, focus?: Section): Question[] => {
  const sections = outlineSections(outline)
  const all = sections.flatMap((section) => [
    placeQuestion(outline, section),
    ...(sectionAfter(outline, section) ? [nextQuestion(outline, section)] : []),
  ])
  const rank = (q: Question) => (isReady(recall[q.key]) ? '' : recall[q.key].due)
  const ordered = shuffled(all).sort((a, b) => rank(a).localeCompare(rank(b)))
  const first = focus && sectionAfter(outline, focus) ? [nextQuestion(outline, focus)] : []
  const rest = ordered.filter((q) => q.key !== first[0]?.key)
  return [...first, ...rest].slice(0, ROUND_LENGTH)
}
