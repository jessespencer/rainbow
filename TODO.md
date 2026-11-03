# To do

Work agreed but not done yet, roughly in order. Tick items off in the commit that finishes them.

## Reading and sharing
- [x] Trim the canvas controls row in each view; it runs too long
- [x] Bible translations: bundle public-domain texts (KJV, WEB, ASV) beside the BSB, loaded on demand
- [x] Other languages' public-domain Bibles (Portuguese, German, Italian, Spanish), mapped to KJV verse numbering
- [x] A translation picker that fits our design (not a copy of trekhleb's), shared by Atlas and Lineage and kept in the URL
- [ ] App language: translate the interface wording to match the Bibles offered
- [x] "Read in…" links for copyrighted translations (ESV, NIV, NLT, NASB)
- [x] Share button on a passage: copy link, copy text, system share sheet
- [ ] Install for offline use

## Look and feel
- [ ] Light mode: parchment base, accents deepened for paper, arcs that darken as they overlap
- [ ] Header rainbow line in the even section colours
- [ ] Lineage category and era colours on the even spectrum, era bands retuned for Deep Night
- [ ] Faint starfield in empty space
- [ ] Arc exposure that follows the view: calm overview, brighter as you filter or zoom
- [ ] Custom dropdowns that open below the control (keep native pickers on touch screens)
- [x] Favicons from the app icons

## Fixes and checks
- [ ] Check wheel zoom in Firefox (trekhleb's app crashed there)
- [ ] Lineage: closing the Controls panel by clicking the timeline also picks a year
- [ ] Family Tree label widths still estimated for DM Mono
- [ ] Test Galaxy's + and − keys, and everything on a real phone
- [ ] Move Atlas onto bible-ui's compact header and `setupSheet`

## Shipping
- [ ] Merge PR 9, then open a PR for `feat/controls-guide`
- [ ] Push and open a PR for By Heart's `feat/deep-night`
- [ ] Decide app addresses (`/bible/atlas/`, a subdomain, or keep `/rainbow/`)

## Skipped
- Greek and Hebrew word links
