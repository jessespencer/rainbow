# To do

Work agreed but not done yet, roughly in order. Tick items off in the commit that finishes them.

## Reading and sharing
- [x] Trim the canvas controls row in each view; it runs too long
- [x] Bible translations: bundle public-domain texts (KJV, WEB, ASV) beside the BSB, loaded on demand
- [x] Other languages' public-domain Bibles (Portuguese, German, Italian, Spanish), mapped to KJV verse numbering
- [x] A translation picker that fits our design (not a copy of trekhleb's), shared by Atlas and Lineage and kept in the URL
- [x] "Read in…" links for copyrighted translations (ESV, NIV, NLT, NASB)
- [x] Share button on a passage: copy link, copy text, system share sheet
- [x] Install for offline use

## Look and feel
- [x] Light mode: parchment base, accents deepened for paper, arcs that darken as they overlap (Day, in the switcher menu; Galaxy stays a night sky)
- [x] Header rainbow line in the even section colours
- [x] Lineage category and era colours tuned for Deep Night (harmonised, not one lightness: twelve categories need lightness to stay apart)
- [x] Faint starfield in empty space (Atlas's arcs view)
- [x] Arc exposure that follows the view: calm overview, brighter as you filter or zoom (arcs already brighten as you zoom; a selection now draws 1.4× brighter over a 10% background)
- [x] Custom dropdowns that open below the control (keep native pickers on touch screens)
- [x] Favicons from the app icons

## Fixes and checks
- [x] Check wheel zoom in Firefox (trekhleb's app crashed there): line and page wheel deltas, Firefox's kind, zoom cleanly in both apps. Not yet run in Firefox itself
- [x] Lineage: closing the Controls panel by clicking the timeline also picks a year
- [x] Family Tree label widths still estimated for DM Mono (now measured in the real fonts)
- [ ] Test Galaxy's + and − keys, and everything on a real phone
- [x] Move Atlas onto bible-ui's compact header and `setupSheet`

## Shipping
- [x] Merge PR 9, then open a PR for `feat/controls-guide` (both landed with PR 10)
- [x] By Heart's Deep Night dark mode (merged in by-heart PR 8)
- [x] Decide app addresses: the repo is `bible`, with Atlas at `/bible/atlas/` and Lineage at `/bible/lineage/`; old `/rainbow/` links redirect
- [x] Bring By Heart in as `apps/byheart`
- [ ] Port By Heart's open branches with `git subtree merge --prefix=apps/byheart`: `claude/launch-blockers` (backups, error boundary, manifest), `claude/where-is-it` (by-heart PR 7), `claude/greek-layer-9d08ee` (fleuron brand mark)
- [ ] Launch By Heart after the launch blockers: add it to the deploy workflow and to bible-ui's `APPS` switcher

## Skipped
- Greek and Hebrew word links
