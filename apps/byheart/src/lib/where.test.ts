import { describe, expect, it } from 'vitest'
import { emptyRecord, type Progress } from './memory'
import { gradeVerse, startedVerses, whereRound } from './where'

const known = { ...emptyRecord(), box: 3 }
const begun = { ...emptyRecord(), stage: 2 }

const progress: Progress = {
  'BSB:EPH:1:3': known,
  'BSB:EPH:2:8': begun,
  'BSB:EPH:2:9': emptyRecord(),
  'KJV:EPH:4:1': known,
  'BSB:ROM:8:1': known,
}

describe('startedVerses', () => {
  it('takes begun and known verses from this translation and book only', () => {
    expect(startedVerses(progress, 'BSB', 'EPH')).toEqual([
      { chapter: 1, verse: 3 },
      { chapter: 2, verse: 8 },
    ])
  })
})

describe('whereRound', () => {
  it('asks each started verse once', () => {
    const round = whereRound(progress, 'BSB', 'EPH')
    expect(round).toHaveLength(2)
    expect(new Set(round.map((p) => p.chapter))).toEqual(new Set([1, 2]))
  })

  it('stops at ten verses however many are started', () => {
    const many: Progress = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`BSB:EPH:1:${i + 1}`, known]))
    expect(whereRound(many, 'BSB', 'EPH')).toHaveLength(10)
  })

  it('draws at random', () => {
    const many: Progress = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`BSB:EPH:1:${i + 1}`, known]))
    const first = whereRound(many, 'BSB', 'EPH', () => 0)
    const second = whereRound(many, 'BSB', 'EPH', () => 0.99)
    expect(first).not.toEqual(second)
  })
})

describe('gradeVerse', () => {
  it.each([
    [8, 8, 'right'],
    [8, 7, 'close'],
    [8, 9, 'close'],
    [8, 10, 'miss'],
  ])('with verse %i, a guess of %i is %s', (answer, guess, grade) => {
    expect(gradeVerse(answer, guess)).toBe(grade)
  })
})
