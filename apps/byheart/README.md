# By Heart

A typographic app for memorizing Scripture, up to whole books. The chapter is printed as a page: unlearned verses are grey, and they darken as you learn them. A first visit asks which book and translation to begin with.

From the repo root:

```bash
pnpm install
pnpm dev:byheart      # http://localhost:5175/bible/byheart/
pnpm test:byheart
```

## Getting around

Press `b` for the contents and `t` for translations. In the contents, type to narrow the books (`eph`, `mk`, `1 cor`), or add a chapter to go straight there (`rom 8`), then press Enter. Number keys pick a translation.

## Structure map

Books with an outline get a one-page map, reached from the main page. Each section shows its name, its verses and how well they are known. Tap one to recite it, even across a chapter break, and quiz yourself on what comes next and on where a passage belongs. Ephesians has an outline so far; add others in `src/lib/outline.ts`.

Quiz recall is scheduled like verses but kept in its own store, apart from verse progress and shared across translations.

## Where is it?

Once three verses of a book are begun, the main page offers a drill in the other direction: a random verse from those you have begun, shown whole, and you find its chapter and verse. Tap or type the numbers. Answers are tallied for the round only and do not change when a verse is next due.

## Translations

BSB, WEB, NET, LEB, KJV, ASV and the Geneva Bible load from the free [Bible API](https://bible.helloao.org) and are cached in the browser. NET and LEB are copyrighted, so the app shows their required credits and links.

The ESV needs a free key from [api.esv.org](https://api.esv.org/account/create-application/), which you paste into the app. Crossway's terms cap stored or displayed text at half a book, so ESV text is shown a chapter at a time and never written to disk.

NIV, NKJV and NLT come through [API.Bible](https://api.bible), which needs a free key and allows only non-commercial use on its free plan. Like the ESV, this text stays in memory, two chapters at most, and each view is reported through API.Bible's FUMS tracker. Their footnotes appear under the text.

In development, put keys in `.env.local` as `VITE_ESV_KEY` and `VITE_API_BIBLE_KEY` so they apply on every port. They are never included in a production build.

Progress is stored per translation in `localStorage`. Browsers can clear it, Safari after a week away unless the app is on the home screen, so the page's colophon saves and restores a JSON backup of progress, structure recall, place and theme. Keys and Bible text are never included. Once there is progress, the app also asks the browser to keep its storage.

## The Greek behind the ESV

Reading Ephesians in the ESV, turn on **Greek** above the page and tap a dotted word. A marginal note gives the Greek word, a transliteration, a short gloss, its grammar and the other verses in Ephesians where it appears. Practice stages never show it, since it could give answers away. The ESV text itself is not stored or changed: the bundled data holds word positions and Greek only.

Only words of meaning are tappable (nouns, verbs, adjectives, adverbs). Three safeguards keep a wrong gloss off the page:

- If a verse's word count differs from the edition the tags were checked against, that verse shows no Greek, and the colophon says so.
- Where a verse has the word in more than one form, the note gives the dictionary form and lists them, because the tags name a word, not an occurrence.
- Tags that could not be confirmed against the ESV wording were dropped, not guessed.

### Sources and licences

| Data | Used for | Source | Licence |
| --- | --- | --- | --- |
| TTESV | ESV word position to Strong's number | Tyndale House, Cambridge ([TyndaleHouse.com](https://www.TyndaleHouse.com)) and [STEP Bible](https://www.STEPBible.org), from [STEPBible-Data](https://STEPBible.github.io/STEPBible-Data/) | CC BY-NC 4.0 |
| TAGNT | Greek text, transliteration, word-for-word English, lemma, grammar codes | [STEP Bible](https://www.STEPBible.org), based on work at Tyndale House | CC BY 4.0 |
| TBESG | Transliteration of dictionary forms | [STEP Bible](https://www.STEPBible.org) | CC BY 4.0 |
| TEGMC | Grammar codes spelled out | [STEP Bible](https://www.STEPBible.org) | CC BY 4.0 |

TTESV's licence covers free software and free publications. Anything sold would need permission from STEP Bible first. It also says the ESV words themselves must come from Crossway, which is why the app reads them from your own API key.

### Changes to the source data

`scripts/build-greek.mjs` rebuilds `src/data/greek-ephesians.json` from a pinned STEPBible-Data commit and lists every change in full. In summary:

- Kept only Ephesians, the Nestle-Aland words of TAGNT, and tags that reach a noun, verb, adjective or adverb, leaving out εἰμί.
- Normalized Greek to Unicode NFC, and mapped three older Strong's numbers to TAGNT's (1492, 3117, 3440).
- At 1:5, moved positions to fit the current ESV wording ("to himself" came after the tags were made).
- Moved tags that sat on the wrong word at 1:5, 2:15, 4:8, 4:16 and 6:12, and dropped nine loose ones.

Please send corrections upstream to STEPBibleATgmail.com, not here.
