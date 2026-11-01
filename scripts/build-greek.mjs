// Builds src/data/greek-ephesians.json from STEPBible's tab-separated data.
//   node scripts/build-greek.mjs [path/to/esv-qa.json]
// The optional file maps "1:5" to verse text and prints every tag beside its English word
// for review. It is never read into the output: no ESV text enters this repository.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SOURCE = 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/be4191f0082aeedddb0eff0c02c966292b2bd641'
const FILES = {
  ttesv: 'Tagged-Bibles/TTESV - Tyndale Translation tags for ESV - TyndaleHouse.com STEPBible.org CC BY-NC.txt',
  tagnt: 'Translators Amalgamated OT+NT/TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt',
  tbesg: 'Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt',
  tegmc: 'Morphology codes/TEGMC - Translators Expansion of Greek Morphhology Codes - STEPBible.org CC BY.txt',
}

// Every departure from the source data, found by reading each tag against the ESV.
// TTESV counts words in an older ESV at 1:5, before "to himself" was added.
const SHIFTS = { '1:5': { from: 7, by: 2 } }
// TTESV uses a few older Strong's numbers where TAGNT has a newer one.
const ALIASES = { '1492': '6063', '3117': '3112', '3440': '3441' }
// Tags on the wrong English word: [verse, Strong's, positions in TTESV, correct positions].
const MOVES = [
  ['1:5', '5206', [7], [5]], // "adoption", which the shift alone would put on "sons"
  ['2:15', '1520', [20], [16]], // "one" new man, not "place"
  ['4:8', '0162', [12], [10]], // "led", not "host"
  ['4:16', '4883', [8], [6]], // "joined"; TTESV crosses these two
  ['4:16', '4822', [6], [8]], // "held"
  ['4:16', '3313', [25], [20]], // "part", not "the"
  ['6:12', '0746', [16], [13]], // TTESV rotates rulers, authorities and cosmic powers
  ['6:12', '1849', [19, 20], [16]],
  ['6:12', '2888', [13], [19, 20]],
]
// Tags dropped because the Greek does not stand behind that English word on its own.
const DROPS = [
  ['1:14', '0629', [10]], // "acquire": only loosely redemption
  ['1:16', '4160', [10]], // "remembering": half of an idiom
  ['4:16', '1520', [20]], // "part"
  ['4:28', '2192', [29]], // "in" need
  ['4:29', '3956', [2]], // "no": pas with mē, not a word for word match
  ['5:1', '3402', [2]], // "be": already tagged on "imitators"
  ['5:7', '1096', [2]], // "do": already tagged on "become"
  ['5:27', '2192', [12]], // "without"
  ['5:33', '3779', [7]], // "love"
]

// Meaning words only. Articles, particles and pronouns make poor hooks, and they are
// where the tags are loosest.
const CONTENT = new Set(['N', 'V', 'A', 'ADV'])
const SKIPPED_LEMMAS = new Set(['εἰμί'])

const cacheDir = 'node_modules/.cache/greek-sources'

const load = async (name) => {
  const path = join(cacheDir, `${name}.txt`)
  const cached = await readFile(path, 'utf8').catch(() => undefined)
  if (cached) return cached.normalize('NFC')
  const url = `${SOURCE}/${FILES[name].split('/').map(encodeURIComponent).join('/')}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`)
  const text = await res.text()
  await mkdir(cacheDir, { recursive: true })
  await writeFile(path, text)
  return text.normalize('NFC')
}

const parseTags = (text) => {
  const verses = {}
  for (const line of text.split('\n')) {
    const match = line.match(/^\$Eph (\d+):(\d+)\t(.*)/)
    if (!match) continue
    const ref = `${match[1]}:${match[2]}`
    verses[ref] = match[3]
      .trim()
      .split('\t')
      .flatMap((field) => {
        const [positions, tags] = field.split('=')
        const at = positions.split('+').map(Number)
        return [...tags.matchAll(/\d{4}/g)].map(([strong]) => ({ at, strong }))
      })
  }
  return verses
}

const parseGreek = (text) => {
  const verses = {}
  for (const line of text.split('\n')) {
    if (!line.startsWith('Eph.')) continue
    const f = line.split('\t')
    const ref = f[0].match(/^Eph\.(\d+)\.(\d+)[^#]*#\d+=(\S+)/)
    const word = f[1].match(/^(.*?)\s*\((.*)\)$/)
    const [dStrong, morph] = f[3].split('=')
    const [lemma, gloss] = f[4].split('=')
    const inNestleAland = /^[Nn]/.test(ref[3])
    if (!inNestleAland) continue
    const key = `${ref[1]}:${ref[2]}`
    ;(verses[key] ??= []).push({
      form: word[1].replace(/[.,;·¶—\s]+$/u, ''),
      translit: word[2],
      literal: f[2]
        .replace(/\[[^\]]*\]\s*|<[^>]*>\s*/g, '')
        .replace(/[.,;:—\s]+$/u, '')
        .trim(),
      dStrong,
      morph,
      lemma,
      gloss,
      strongs: new Set([...`${f[3]} ${f[11]} ${f[12]}`.matchAll(/G(\d{4})/g)].map((m) => m[1])),
    })
  }
  return verses
}

const parseLexicon = (text) => {
  const entries = new Map()
  for (const line of text.split('\n')) {
    const f = line.split('\t')
    if (/^G\d{4}/.test(f[0]) && f[4]) entries.set(f[0], f[4])
  }
  return entries
}

const parseMorphology = (text) => {
  const codes = new Map()
  for (const line of text.split('\n')) {
    const [code, detail] = line.split('\t')
    if (!detail?.startsWith('Function=') || codes.has(code)) continue
    const fields = Object.fromEntries(detail.split('; ').map((part) => part.split('=')))
    const lower = (s) => s?.toLowerCase()
    const person = [fields.Person, lower(fields.Number)].filter(Boolean).join(' ')
    const parts = [
      [lower(fields.Tense), lower(fields.Voice), lower(fields.Mood ?? fields.Form)].filter(Boolean).join(' '),
      fields.Case && [lower(fields.Case), lower(fields.Number), lower(fields.Gender)].filter(Boolean).join(' '),
      !fields.Case && person,
    ]
    const label = parts.filter(Boolean).join(', ')
    codes.set(code, label || lower(fields.Function))
  }
  return codes
}

const partOfSpeech = (word) => word.morph.split('-')[0]

const matching = (candidates, key) => [...new Set(candidates.map(key))]
const single = (values) => (values.length === 1 ? values[0] : undefined)

const buildVerse = (ref, tags, words, count, lexicon, morphology, report) => {
  const shift = SHIFTS[ref]
  const corrected = tags
    .filter(({ at, strong }) => !DROPS.some((d) => d[0] === ref && d[1] === strong && String(d[2]) === String(at)))
    .map(({ at, strong }) => {
      const move = MOVES.find((m) => m[0] === ref && m[1] === strong && String(m[2]) === String(at))
      if (move) return { at: move[3], strong }
      return { at: shift ? at.map((p) => (p >= shift.from ? p + shift.by : p)) : at, strong }
    })

  const merged = new Map()
  for (const { at, strong } of corrected) {
    if (Math.max(...at) > count) throw new Error(`${ref}: tag past the end of the verse`)
    const wanted = ALIASES[strong] ?? strong
    const candidates = words.filter((w) => w.strongs.has(wanted))
    if (!candidates.some((w) => CONTENT.has(partOfSpeech(w)))) {
      report.skipped += 1
      continue
    }
    // A word can list a number as an alternate tag, so prefer the words it names outright.
    const named = candidates.filter((w) => CONTENT.has(partOfSpeech(w)) && w.dStrong.includes(wanted))
    const content = named.length ? named : candidates.filter((w) => CONTENT.has(partOfSpeech(w)))
    const lemma = single(matching(content, (w) => w.lemma))
    if (!lemma) throw new Error(`${ref}: <${strong}> reaches two lemmas`)
    if (SKIPPED_LEMMAS.has(lemma)) {
      report.skipped += 1
      continue
    }
    const forms = matching(content, (w) => w.form)
    const form = single(forms)
    const entry = {
      lemma,
      ...(form
        ? {
            form,
            translit: content[0].translit,
            parse: single(matching(content, (w) => morphology.get(w.morph) ?? '')),
            literal: single(matching(content, (w) => w.literal)),
          }
        : { forms }),
    }
    report[form ? 'exact' : 'lemmaOnly'] += 1
    const key = at.join('+')
    if (!merged.has(key)) merged.set(key, { at, greek: [] })
    merged.get(key).greek.push(entry)
    report.rows.push([ref, at, strong, entry])
  }
  return { n: count, tags: [...merged.values()].sort((a, b) => a.at[0] - b.at[0]) }
}

const [tagText, greekText, lexiconText, morphText] = await Promise.all(['ttesv', 'tagnt', 'tbesg', 'tegmc'].map(load))
const counts = JSON.parse(await readFile('scripts/esv-ephesians-word-counts.json', 'utf8'))
const tagsByVerse = parseTags(tagText)
const greekByVerse = parseGreek(greekText)
const lexicon = parseLexicon(lexiconText)
const morphology = parseMorphology(morphText)

const report = { exact: 0, lemmaOnly: 0, skipped: 0, rows: [] }
const verses = {}
for (const ref of Object.keys(tagsByVerse)) {
  verses[ref] = buildVerse(ref, tagsByVerse[ref], greekByVerse[ref], counts[ref], lexicon, morphology, report)
}

const lemmas = {}
for (const [ref, words] of Object.entries(greekByVerse)) {
  for (const word of words) {
    const entry = (lemmas[word.lemma] ??= {
      translit: lexicon.get(word.dStrong) ?? lexicon.get(word.dStrong.slice(0, 5)),
      gloss: word.gloss,
      refs: [],
    })
    if (!entry.translit) throw new Error(`No transliteration for ${word.lemma}`)
    if (entry.refs.at(-1) !== ref) entry.refs.push(ref)
  }
}
const used = new Set(report.rows.flatMap((r) => r[3].lemma))
for (const lemma of Object.keys(lemmas)) if (!used.has(lemma)) delete lemmas[lemma]

await writeFile('src/data/greek-ephesians.json', `${JSON.stringify({ lemmas, verses })}\n`)
console.log(`${report.exact} exact, ${report.lemmaOnly} lemma only, ${report.skipped} skipped; ${used.size} lemmas`)

const qa = process.argv[2]
if (qa) {
  const text = JSON.parse(await readFile(qa, 'utf8'))
  for (const [ref, at, strong, entry] of report.rows) {
    const english = text[ref].match(/[\p{L}\p{N}]+/gu)
    const word = at.map((p) => english[p - 1]).join(' ')
    console.log(`${ref}\t${word}\t${strong}\t${entry.form ?? `(${entry.forms.join(' / ')})`}\t${entry.lemma}\t${lemmas[entry.lemma].gloss}\t${entry.literal ?? ''}`)
  }
}
