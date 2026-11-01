# By Heart

A typographic app for memorizing Scripture, up to whole books. The chapter is printed as a page: unlearned verses are grey, and they darken as you learn them.

```bash
npm install
npm run dev
```

## Translations

BSB, WEB, KJV, ASV and the Geneva Bible load from the free [Bible API](https://bible.helloao.org) and are cached in the browser.

The ESV needs a free key from [api.esv.org](https://api.esv.org/account/create-application/), which you paste into the app. Crossway's terms cap stored or displayed text at half a book, so ESV text is shown a chapter at a time and never written to disk.

Progress is stored per translation in `localStorage`.
