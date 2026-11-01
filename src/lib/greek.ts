export interface GreekWord {
  lemma: string
  // One spelling when the tag settles it; `forms` when a verse has the word in several.
  form?: string
  forms?: string[]
  translit?: string
  parse?: string
  literal?: string
}

export interface GreekTag {
  at: number[]
  greek: GreekWord[]
}

export interface GreekVerse {
  n: number
  tags: GreekTag[]
}

export interface Lemma {
  translit: string
  gloss: string
  refs: string[]
}

export interface GreekData {
  lemmas: Record<string, Lemma>
  verses: Record<string, GreekVerse>
}

export interface Piece {
  text: string
  tag?: GreekTag
}

// Word positions come from TTESV, which counts "God's" as two words and "well-being" as two.
const taggedWord = /[\p{L}\p{N}]+/gu

export const hasGreek = (translation: string, bookCode: string) => translation === 'ESV' && bookCode === 'EPH'

export const loadGreek = async (): Promise<GreekData> => {
  const data = await import('../data/greek-ephesians.json')
  return data.default as GreekData
}

// Splits a verse into pieces that join back into exactly the same text. A verse whose word
// count differs from the tagged edition returns undefined: positions cannot be trusted there.
export const splitVerse = (text: string, verse: GreekVerse): Piece[] | undefined => {
  const words = [...text.matchAll(taggedWord)]
  if (words.length !== verse.n) return undefined
  const tagAt = new Map(verse.tags.flatMap((tag) => tag.at.map((position) => [position, tag] as const)))
  const pieces: Piece[] = []
  let cursor = 0
  words.forEach((word, i) => {
    const tag = tagAt.get(i + 1)
    if (!tag) return
    if (word.index > cursor) pieces.push({ text: text.slice(cursor, word.index) })
    pieces.push({ text: word[0], tag })
    cursor = word.index + word[0].length
  })
  if (cursor < text.length) pieces.push({ text: text.slice(cursor) })
  return pieces
}
