# By Heart

A typographic app for memorizing Scripture, up to whole books. The chapter is printed as a page: unlearned verses are grey, and they darken as you learn them. A first visit asks which book and translation to begin with.

```bash
npm install
npm run dev
npm test
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

Progress is stored per translation in `localStorage`.
