export interface Token {
  id: number
  verseIndex: number
  before: string
  word: string
  after: string
  initial: string
}

const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export const cleanWord = (word: string) => normalize(word).replace(/[^\p{L}\p{N}]/gu, '')

const wordPattern = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu

export const tokenize = (texts: string[]): Token[] => {
  const tokens: Token[] = []
  texts.forEach((text, verseIndex) => {
    const startOfVerse = tokens.length
    let cursor = 0
    for (const match of text.matchAll(wordPattern)) {
      const gap = text.slice(cursor, match.index)
      const split = gap.search(/\s/)
      const hugsPrevious = tokens.length > startOfVerse
      // Punctuation before the first space hugs the previous word; the rest opens this one.
      if (hugsPrevious) tokens[tokens.length - 1].after += split === -1 ? gap : gap.slice(0, split)
      const opening = hugsPrevious ? (split === -1 ? '' : gap.slice(split).trim()) : gap.trim()
      tokens.push({
        id: tokens.length,
        verseIndex,
        before: opening,
        word: match[0],
        after: '',
        initial: cleanWord(match[0]).charAt(0),
      })
      cursor = match.index + match[0].length
    }
    if (tokens.length > startOfVerse) tokens[tokens.length - 1].after += text.slice(cursor).trim()
  })
  return tokens
}

const endsClause = (token: Token) => /[,;:.!?—–]/.test(token.after)

// Colometry: break a verse into breathable sense lines, the way the Psalms are
// printed. Fixed breaks also give every verse a stable shape to remember.
export const senseLines = (tokens: Token[], maxWords = 9, minWords = 3): Token[][] => {
  const lines: Token[][] = []
  let line: Token[] = []
  tokens.forEach((token, i) => {
    line.push(token)
    const next = tokens[i + 1]
    const verseEnd = !next || next.verseIndex !== token.verseIndex
    const clauseEnd = endsClause(token)
    // Stretch a full line a little if that lets it end on a natural pause.
    const pauseSoon = tokens.slice(i + 1, i + 4).some((t) => t.verseIndex === token.verseIndex && endsClause(t))
    const tooLong = line.length >= (pauseSoon ? maxWords + 3 : maxWords)
    if (verseEnd || (clauseEnd && line.length >= minWords) || tooLong) {
      lines.push(line)
      line = []
    }
  })
  const merged: Token[][] = []
  for (const current of lines) {
    const prev = merged[merged.length - 1]
    const sameVerse = prev && prev[0].verseIndex === current[0].verseIndex
    if (sameVerse && current.length < minWords && prev.length + current.length <= maxWords + 2) {
      prev.push(...current)
    } else {
      merged.push(current)
    }
  }
  return merged
}

const hashSeed = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const seededRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const shuffled = <T,>(items: T[], random: () => number = Math.random): T[] => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const lightWords = new Set(
  'a an and as at be but by for from he her him his i if in is it its of on or our she so that the their them they this to us was we were who with you your'.split(
    ' ',
  ),
)

const isLight = (t: Token) => lightWords.has(cleanWord(t.word))

// Blank the words that carry the meaning; small connective words stay as handholds.
export const pickBlanks = (tokens: Token[], seed: string, share = 0.38): Set<number> => {
  const heavy = tokens.filter((t) => !isLight(t))
  const count = Math.max(1, Math.round(tokens.length * share))
  const pool = shuffled(heavy.length ? heavy : tokens, seededRandom(hashSeed(seed)))
  return new Set(pool.slice(0, count).map((t) => t.id))
}

// Small words leave first, so the last thing to vanish is the sense of the verse.
export const vanishOrder = (tokens: Token[], seed: string): number[] => {
  const random = seededRandom(hashSeed(seed))
  const light = shuffled(tokens.filter(isLight), random)
  const heavy = shuffled(tokens.filter((t) => !isLight(t)), random)
  return [...light, ...heavy].map((t) => t.id)
}
