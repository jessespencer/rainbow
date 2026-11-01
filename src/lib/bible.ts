export interface Verse {
  chapter: number
  verse: number
  text: string
}

export interface Book {
  code: string
  name: string
  chapters: number
}

export interface Translation {
  id: string
  name: string
  apiId?: string
}

export const TRANSLATIONS: Translation[] = [
  { id: 'ESV', name: 'English Standard Version' },
  { id: 'BSB', name: 'Berean Standard Bible', apiId: 'BSB' },
  { id: 'WEB', name: 'World English Bible', apiId: 'ENGWEBP' },
  { id: 'KJV', name: 'King James Version', apiId: 'eng_kjv' },
  { id: 'ASV', name: 'American Standard Version', apiId: 'eng_asv' },
  { id: 'GNV', name: 'Geneva Bible, 1599', apiId: 'eng_gnv' },
]

const bookTable =
  'GEN Genesis 50|EXO Exodus 40|LEV Leviticus 27|NUM Numbers 36|DEU Deuteronomy 34|JOS Joshua 24|JDG Judges 21|RUT Ruth 4|1SA 1_Samuel 31|2SA 2_Samuel 24|1KI 1_Kings 22|2KI 2_Kings 25|1CH 1_Chronicles 29|2CH 2_Chronicles 36|EZR Ezra 10|NEH Nehemiah 13|EST Esther 10|JOB Job 42|PSA Psalms 150|PRO Proverbs 31|ECC Ecclesiastes 12|SNG Song_of_Solomon 8|ISA Isaiah 66|JER Jeremiah 52|LAM Lamentations 5|EZK Ezekiel 48|DAN Daniel 12|HOS Hosea 14|JOL Joel 3|AMO Amos 9|OBA Obadiah 1|JON Jonah 4|MIC Micah 7|NAM Nahum 3|HAB Habakkuk 3|ZEP Zephaniah 3|HAG Haggai 2|ZEC Zechariah 14|MAL Malachi 4|MAT Matthew 28|MRK Mark 16|LUK Luke 24|JHN John 21|ACT Acts 28|ROM Romans 16|1CO 1_Corinthians 16|2CO 2_Corinthians 13|GAL Galatians 6|EPH Ephesians 6|PHP Philippians 4|COL Colossians 4|1TH 1_Thessalonians 5|2TH 2_Thessalonians 3|1TI 1_Timothy 6|2TI 2_Timothy 4|TIT Titus 3|PHM Philemon 1|HEB Hebrews 13|JAS James 5|1PE 1_Peter 5|2PE 2_Peter 3|1JN 1_John 5|2JN 2_John 1|3JN 3_John 1|JUD Jude 1|REV Revelation 22'

export const BOOKS: Book[] = bookTable.split('|').map((row) => {
  const [code, name, chapters] = row.split(' ')
  return { code, name: name.replace(/_/g, ' '), chapters: Number(chapters) }
})

export const getBook = (code: string) => BOOKS.find((b) => b.code === code) ?? BOOKS[48]

export class MissingKeyError extends Error {}

const esvKeyStore = 'byheart.esvKey'

export const getEsvKey = () => localStorage.getItem(esvKeyStore) ?? ''
export const setEsvKey = (key: string) => localStorage.setItem(esvKeyStore, key.trim())

// Crossway caps local storage at half a book, so ESV text stays in memory and only
// the two most recent chapters are kept. Everything else here is public domain.
const esvChapters = new Map<string, Verse[]>()

const rememberEsv = (key: string, verses: Verse[]) => {
  esvChapters.set(key, verses)
  if (esvChapters.size > 2) esvChapters.delete(esvChapters.keys().next().value!)
}

interface ContentPart {
  text?: string
}

const fetchPublicDomain = async (t: Translation, book: Book, chapter: number): Promise<Verse[]> => {
  const storeKey = `byheart.text.${t.id}.${book.code}.${chapter}`
  const cached = localStorage.getItem(storeKey)
  if (cached) return JSON.parse(cached) as Verse[]

  const res = await fetch(`https://bible.helloao.org/api/${t.apiId}/${book.code}/${chapter}.json`)
  if (!res.ok) throw new Error(`Could not load ${book.name} ${chapter}`)
  const data = (await res.json()) as {
    chapter: { content: { type: string; number?: number; content?: (string | ContentPart)[] }[] }
  }
  const verses = data.chapter.content
    .filter((c) => c.type === 'verse')
    .map((c) => ({
      chapter,
      verse: c.number!,
      text: (c.content ?? [])
        .map((part) => (typeof part === 'string' ? part : (part.text ?? '')))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    }))
  try {
    localStorage.setItem(storeKey, JSON.stringify(verses))
  } catch {
    // Storage full: the text simply gets fetched again next time.
  }
  return verses
}

export const parseEsv = (passage: string, chapter: number): Verse[] => {
  const parts = passage.split(/\[(?:\d+:)?(\d+)\]/)
  const verses: Verse[] = []
  if (parts[0].trim()) verses.push({ chapter, verse: 1, text: parts[0] })
  for (let i = 1; i < parts.length; i += 2) {
    verses.push({ chapter, verse: Number(parts[i]), text: parts[i + 1] })
  }
  return verses
    .map((v) => ({ ...v, text: v.text.replace(/\(ESV\)\s*$/, '').replace(/\s+/g, ' ').trim() }))
    .filter((v) => v.text)
}

const fetchEsv = async (book: Book, chapter: number): Promise<Verse[]> => {
  const cacheKey = `${book.code}.${chapter}`
  const cached = esvChapters.get(cacheKey)
  if (cached) return cached

  const key = getEsvKey()
  if (!key) throw new MissingKeyError()
  const params = new URLSearchParams({
    q: `${book.name} ${chapter}`,
    'include-passage-references': 'false',
    'include-first-verse-numbers': 'true',
    'include-verse-numbers': 'true',
    'include-footnotes': 'false',
    'include-footnote-body': 'false',
    'include-headings': 'false',
    'include-short-copyright': 'false',
    'include-passage-horizontal-lines': 'false',
    'include-heading-horizontal-lines': 'false',
    'indent-paragraphs': '0',
    'indent-poetry': 'false',
    'line-length': '0',
  })
  const res = await fetch(`https://api.esv.org/v3/passage/text/?${params}`, {
    headers: { Authorization: `Token ${key}` },
  })
  if (res.status === 401 || res.status === 403) throw new MissingKeyError('That ESV key was not accepted.')
  if (!res.ok) throw new Error(`Could not load ${book.name} ${chapter}`)
  const data = (await res.json()) as { passages: string[] }
  const verses = parseEsv(data.passages.join(' '), chapter)
  rememberEsv(cacheKey, verses)
  return verses
}

export const fetchChapter = (translationId: string, book: Book, chapter: number): Promise<Verse[]> => {
  const t = TRANSLATIONS.find((x) => x.id === translationId) ?? TRANSLATIONS[1]
  return t.apiId ? fetchPublicDomain(t, book, chapter) : fetchEsv(book, chapter)
}

export const refLabel = (book: Book, verses: Verse[]) => {
  const first = verses[0]
  const last = verses[verses.length - 1]
  if (!first) return book.name
  if (first.verse === last.verse) return `${book.name} ${first.chapter}:${first.verse}`
  return `${book.name} ${first.chapter}:${first.verse}–${last.verse}`
}

export const ESV_NOTICE =
  'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.'
