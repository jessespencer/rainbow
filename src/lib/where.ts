import type { Progress } from './memory'
import { shuffled } from './text'

export interface Place {
  chapter: number
  verse: number
}

export type PlaceGrade = 'right' | 'close' | 'miss'

export const WHERE_MINIMUM = 3

const ROUND_SIZE = 10

// Placing a verse you have never met would only be a guess, so a round draws on the ones
// already begun, in any chapter.
export const startedVerses = (progress: Progress, translation: string, book: string): Place[] => {
  const prefix = `${translation}:${book}:`
  return Object.entries(progress)
    .filter(([key, record]) => key.startsWith(prefix) && (record.box > 0 || record.stage > 0))
    .map(([key]) => {
      const [, , chapter, verse] = key.split(':')
      return { chapter: Number(chapter), verse: Number(verse) }
    })
}

export const whereRound = (progress: Progress, translation: string, book: string, random?: () => number) =>
  shuffled(startedVerses(progress, translation, book), random).slice(0, ROUND_SIZE)

export const gradeVerse = (answer: number, guess: number): PlaceGrade => {
  if (guess === answer) return 'right'
  return Math.abs(guess - answer) === 1 ? 'close' : 'miss'
}
