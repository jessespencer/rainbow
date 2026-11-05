export interface Verse {
  chapter: number
  verse: number
  text: string
  notes?: string[]
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
  apiBibleId?: string
  keySource?: { lender: string; site: string; url: string }
  // Some publishers want the full notice beside the text on every screen, not just the page.
  creditOnRecitals?: boolean
  // What the rights holder asks to be shown with the text. Public domain needs neither.
  credit?: string
  links?: { label: string; url: string }[]
}

const API_BIBLE = { lender: 'API.Bible', site: 'api.bible', url: 'https://api.bible/sign-up' }

export const TRANSLATIONS: Translation[] = [
  {
    id: 'ESV',
    name: 'English Standard Version',
    keySource: { lender: 'Crossway', site: 'api.esv.org', url: 'https://api.esv.org/account/create-application/' },
    credit:
      'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.',
    links: [{ label: 'ESV.org', url: 'https://www.esv.org' }],
  },
  {
    id: 'NIV',
    name: 'New International Version',
    apiBibleId: '78a9f6124f344018-01',
    keySource: API_BIBLE,
    credit:
      'The Holy Bible, New International Version® NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by Permission of Biblica, Inc.® All rights reserved worldwide.',
    creditOnRecitals: true,
    links: [
      { label: 'Biblica', url: 'https://www.biblica.com' },
      { label: 'API.Bible', url: 'https://api.bible' },
    ],
  },
  {
    id: 'NKJV',
    name: 'New King James Version',
    apiBibleId: '63097d2a0a2f7db3-01',
    keySource: API_BIBLE,
    credit: 'New King James Version®, Copyright © 1982, Thomas Nelson. All rights reserved.',
    links: [
      { label: 'NKJV', url: 'https://www.harpercollins.com' },
      { label: 'API.Bible', url: 'https://api.bible' },
    ],
  },
  {
    id: 'NLT',
    name: 'New Living Translation',
    apiBibleId: 'd6e14a625393b4da-01',
    keySource: API_BIBLE,
    credit:
      'Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation. All rights reserved. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved.',
    links: [
      { label: 'NLT', url: 'https://www.tyndale.com' },
      { label: 'API.Bible', url: 'https://api.bible' },
    ],
  },
  { id: 'BSB', name: 'Berean Standard Bible', apiId: 'BSB' },
  { id: 'WEB', name: 'World English Bible', apiId: 'ENGWEBP' },
  {
    id: 'NET',
    name: 'NET Bible',
    apiId: 'eng_net',
    credit: 'Scripture quotations are from the NET Bible® copyright ©1996, 2019 by Biblical Studies Press, L.L.C. All rights reserved.',
    links: [{ label: 'NET', url: 'https://netbible.org' }],
  },
  {
    id: 'LEB',
    name: 'Lexham English Bible',
    apiId: 'eng_leb',
    credit:
      'Scripture quotations marked (LEB) are from the Lexham English Bible. Copyright 2012 Logos Bible Software. Lexham is a registered trademark of Logos Bible Software.',
    links: [
      { label: 'LEB', url: 'http://www.lexhamenglishbible.com' },
      { label: 'Logos Bible Software', url: 'http://www.logos.com' },
    ],
  },
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

export const getTranslation = (id: string) =>
  TRANSLATIONS.find((t) => t.id === id) ?? TRANSLATIONS.find((t) => t.id === 'BSB')!

export const getBook = (code: string) => BOOKS.find((b) => b.code === code) ?? BOOKS[48]

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '')

const isScatteredIn = (letters: string, word: string) => {
  let found = 0
  for (const letter of word) if (letter === letters[found]) found++
  return found === letters.length
}

// Lower is closer. Scattered letters catch abbreviations like "mk", and the shortest name wins.
const closeness = (book: Book, query: string) => {
  const name = squash(book.name)
  if (name.startsWith(query)) return 0
  if (book.name.toLowerCase().split(' ').some((word) => word.startsWith(query))) return 1
  if (book.code.toLowerCase().startsWith(query)) return 2
  return isScatteredIn(query, name) ? 3 + name.length / 100 : undefined
}

// "rom 8", "1 cor" and "john 3:16" all work. A leading number belongs to the book's name.
export const findBooks = (query: string) => {
  const [, name = query, chapter] = query.trim().match(/^(.*[a-z])\s*(\d+)(?::\d+)?$/i) ?? []
  const scored = BOOKS.map((book) => ({ book, score: closeness(book, squash(name)) })).filter(
    (found): found is { book: Book; score: number } => found.score !== undefined,
  )
  // Scattered letters are only a fallback, or "1 th" would also ink 1 Corinthians.
  const clean = scored.filter((found) => found.score < 3)
  const kept = clean.length ? clean : scored
  const best = kept.reduce<(typeof kept)[number] | undefined>(
    (closest, found) => (!closest || found.score < closest.score ? found : closest),
    undefined,
  )
  return { matches: kept.map((found) => found.book), best: best?.book, chapter: Number(chapter) || undefined }
}

export class MissingKeyError extends Error {}

const keyStore = (t: Translation) => (t.apiBibleId ? 'byheart.apiBibleKey' : 'byheart.esvKey')

// A key in .env.local saves pasting it on each dev port. These only exist in development,
// so a production build can never carry a key to anyone else.
const envKey = (t: Translation) => {
  if (!import.meta.env.DEV) return ''
  return (t.apiBibleId ? import.meta.env.VITE_API_BIBLE_KEY : import.meta.env.VITE_ESV_KEY) ?? ''
}

export const getKey = (t: Translation) => localStorage.getItem(keyStore(t)) || envKey(t)
export const setKey = (t: Translation, key: string) => localStorage.setItem(keyStore(t), key.trim())

// Licensed text stays in memory, never on disk, and only the two most recent chapters
// are kept. Crossway caps storage at half a book, and API.Bible and Biblica set their own
// limits, so every licensed translation shares this one small shelf.
const heldChapters = new Map<string, { verses: Verse[]; fumsToken?: string }>()

const hold = (key: string, verses: Verse[], fumsToken?: string) => {
  heldChapters.set(key, { verses, fumsToken })
  if (heldChapters.size > 2) heldChapters.delete(heldChapters.keys().next().value!)
}

interface ApiNode {
  name?: string
  text?: string
  attrs?: { number?: string }
  items?: ApiNode[]
}

const plainText = (node: ApiNode): string => node.text ?? (node.items ?? []).map(plainText).join('')

// A verse can run across paragraphs, so text gathers under the most recent verse marker
// until the next one. Footnotes are set aside rather than left in the words to memorize.
export const parseApiBible = (content: ApiNode[], chapter: number): Verse[] => {
  const verses: Verse[] = []
  const visit = (node: ApiNode) => {
    const current = verses[verses.length - 1]
    if (node.name === 'verse') {
      verses.push({ chapter, verse: parseInt(node.attrs!.number!), text: '', notes: [] })
    } else if (node.name === 'note') {
      current?.notes!.push(plainText(node).trim())
    } else if (node.text !== undefined) {
      if (current) current.text += node.text
    } else {
      if (node.name === 'para' && current) current.text += ' '
      node.items?.forEach(visit)
    }
  }
  content.forEach(visit)
  return verses.map((v) => ({ ...v, text: v.text.replace(/\s+/g, ' ').replace(/ ([,.;:!?])/g, '$1').trim() }))
}

type FumsWindow = Window & { fums?: (...args: unknown[]) => void; fumsData?: unknown[] }

// API.Bible requires each view of its text to be reported. The tracker loads only when
// one of its translations is on screen.
const reportView = (fumsToken: string) => {
  const w = window as FumsWindow
  if (!w.fums) {
    w.fumsData = []
    w.fums = (...args) => w.fumsData!.push(args)
    const script = document.createElement('script')
    script.src = 'https://pkg.api.bible/fumsV3.min.js'
    document.body.append(script)
  }
  w.fums('trackView', fumsToken)
}

interface ContentPart {
  text?: string
}

const unreachable = (book: Book, chapter: number) =>
  new Error(`Could not reach ${book.name} ${chapter}. Check your connection.`)

const fetchPublicDomain = async (t: Translation, book: Book, chapter: number): Promise<Verse[]> => {
  const storeKey = `byheart.text.${t.id}.${book.code}.${chapter}`
  const cached = localStorage.getItem(storeKey)
  if (cached) return JSON.parse(cached) as Verse[]

  const res = await fetch(`https://bible.helloao.org/api/${t.apiId}/${book.code}/${chapter}.json`).catch(() => {
    throw unreachable(book, chapter)
  })
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
        // The LEB's half brackets mark idioms. On a page to memorize they are only noise.
        .replace(/[⸤⸥]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/ ([,.;:!?])/g, '$1')
        .trim(),
    }))
  try {
    localStorage.setItem(storeKey, JSON.stringify(verses))
  } catch {
    // Storage full: the text simply gets fetched again next time.
  }
  return verses
}

export const parseVerses = (passage: string, chapter: number): Verse[] => {
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

const fetchApiBible = async (t: Translation, book: Book, chapter: number): Promise<Verse[]> => {
  const heldKey = `${t.id}.${book.code}.${chapter}`
  const held = heldChapters.get(heldKey)
  if (held) {
    reportView(held.fumsToken!)
    return held.verses
  }

  const key = getKey(t)
  if (!key) throw new MissingKeyError()
  const params = new URLSearchParams({
    'content-type': 'json',
    'include-notes': 'true',
    'include-titles': 'false',
    'include-chapter-numbers': 'false',
    'include-verse-numbers': 'true',
    'include-verse-spans': 'false',
    'fums-version': '3',
  })
  const res = await fetch(`https://rest.api.bible/v1/bibles/${t.apiBibleId}/chapters/${book.code}.${chapter}?${params}`, {
    headers: { 'api-key': key },
  }).catch(() => {
    throw unreachable(book, chapter)
  })
  if (res.status === 401 || res.status === 403) throw new MissingKeyError('That key was not accepted for this translation.')
  if (!res.ok) throw new Error(`Could not load ${book.name} ${chapter}`)
  const data = (await res.json()) as { data: { content: ApiNode[] }; meta: { fumsToken: string } }
  const verses = parseApiBible(data.data.content, chapter)
  hold(heldKey, verses, data.meta.fumsToken)
  reportView(data.meta.fumsToken)
  return verses
}

const fetchEsv = async (t: Translation, book: Book, chapter: number): Promise<Verse[]> => {
  const heldKey = `${t.id}.${book.code}.${chapter}`
  const held = heldChapters.get(heldKey)
  if (held) return held.verses

  const key = getKey(t)
  if (!key) throw new MissingKeyError()
  const params = new URLSearchParams({
    // A chapter number on a one-chapter book would read as a verse.
    q: book.chapters === 1 ? book.name : `${book.name} ${chapter}`,
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
  }).catch(() => {
    // Crossway sends rejections without CORS headers, so a bad key arrives here as a failed
    // request rather than a 403. Only being offline rules the key out.
    throw navigator.onLine ? new MissingKeyError('Crossway turned that request away. Check your key.') : unreachable(book, chapter)
  })
  if (res.status === 401 || res.status === 403) throw new MissingKeyError('That ESV key was not accepted.')
  if (!res.ok) throw new Error(`Could not load ${book.name} ${chapter}`)
  const data = (await res.json()) as { passages: string[] }
  const verses = parseVerses(data.passages.join(' '), chapter)
  hold(heldKey, verses)
  return verses
}

export const fetchChapter = (translationId: string, book: Book, chapter: number): Promise<Verse[]> => {
  const t = getTranslation(translationId)
  if (t.apiBibleId) return fetchApiBible(t, book, chapter)
  return t.apiId ? fetchPublicDomain(t, book, chapter) : fetchEsv(t, book, chapter)
}

export const refLabel = (book: Book, verses: Verse[]) => {
  const first = verses[0]
  const last = verses[verses.length - 1]
  if (!first) return book.name
  if (first.verse === last.verse) return `${book.name} ${first.chapter}:${first.verse}`
  return `${book.name} ${first.chapter}:${first.verse}–${last.verse}`
}
