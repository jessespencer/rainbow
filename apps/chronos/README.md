# Chronos

> *4,150 years on one screen. Every bar a life, every overlap a shared moment in history.*

**▶ [Open Chronos](https://jessespencer.github.io/rainbow/timeline/)**

Chronos is an interactive Bible timeline, from Adam to the resurrection of Jesus (~AD 33). It opens on the whole story, then lets you zoom into any reign, read the scripture behind a person, and see who was alive at the same moment. It works on phones as well as desktops.

## Features

- **The whole story at once.** 157 lives fit on one screen, and rows grow into named bars as you zoom in.
- **People.** Select anyone to read about them, with BSB scripture and everyone alive alongside them.
- **Years.** Pick any year to see who was alive. Drag across the lanes with a mouse, or along the date strip with a finger.
- **Two views.** Timeline shows lifespans and reigns. Lineage is a subway map of the generations, with the Messianic line running to Jesus.
- **King and Priest.** Follow the royal line from Judah and the priestly line from Levi, both leading to Jesus, one by descent and the other by God's oath.
- **Search.** Find a person, a year like 586 BC, or an era. Press ⌘K or Ctrl K from anywhere.
- **Controls.** A button that explains how to explore each view, with a short tip on your first visit. On a keyboard, `+` and `−` zoom.
- **Links into Rainbow.** Open any passage in [Rainbow Reference](../rainbow) to see its cross-references.
- **Shareable.** Every selection has its own address, such as `?figure=king-david` or `?year=-586`.
- **Phones.** Pinch to zoom, pan with a finger, and read in a bottom sheet.

## Run it

From the repo root:

```bash
pnpm install
pnpm dev:chronos      # http://localhost:5174/rainbow/timeline/
pnpm build:chronos    # type-check and build for production
```

Run `pnpm dev:rainbow` too if you want the links into Rainbow to work locally.

## Data

157 figures with birth, death, reign dates, scripture references, and blurbs. Chronology sources:

| Period | Source |
|---|---|
| Pre-monarchy (Adam → David) | James Ussher, *Annals of the World* (1650) |
| Divided kingdom | Edwin R. Thiele, *The Mysterious Numbers of the Hebrew Kings* (3rd ed., 1983) |

These are particular chronologies, not a scholarly consensus. Prophets' lifespans and some genealogical dates are estimates, and for some kings the reign stands in for an unknown birth and death.

Priests' dates are estimates spaced by generation, since scripture gives almost none.

Scripture text is the [Berean Standard Bible](https://berean.bible/), dedicated to the public domain.

## License

[MIT](../../LICENSE)
