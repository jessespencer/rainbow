# Experience improvement roadmap

Captured October 15, 2026, from the design assessment of Rainbow Reference and Chronos.

## Direction

Build toward an interactive museum exhibit: dramatic at a distance, clear up close, and rewarding to explore. Preserve the dark canvas, rainbow silhouette, Fraunces typography, and scale of the data. Make discovering a meaningful connection feel as extraordinary as seeing the whole visualization.

The first major outcome is one polished discovery journey: enter the rainbow, select a curated connection, read both passages, follow its thread, and return without losing your place.

All six milestones are complete on `codex/experience-improvements`. Local implementation and verification finished October 17, 2026; the user confirmed completion of all remaining human/device acceptance checks on October 18, 2026. See [EXPERIENCE-VALIDATION.md](EXPERIENCE-VALIDATION.md) for the evidence and sign-off.

## 1. Make the existing experience clearer

Small improvements to orientation, readability, and trustworthy behavior before expanding the experience.

- [x] Explain what each view represents. In Arcs, explicitly describe aggregated book-to-book references rather than implying each rendered arc represents one verse pair.
- [x] Improve contrast and text size for essential controls; enlarge click/touch targets and add consistent visible keyboard focus.
- [x] Group secondary controls and distinguish primary actions from secondary pills.
- [x] Give Chronos a **Whole story** action and named era destinations.
- [x] Give first entry into Narrative a useful framing; preserve intentional navigation when returning to a previously explored view.
- [x] Correct or explicitly relabel heatmap category filtering: it currently hides cells by dominant category while retaining total connection counts.
- [x] Add a readable heatmap intensity legend.
- [x] Pause Galaxy rendering when its view is hidden; resume cleanly on return.

**Done when:** each view explains its marks, important controls are legible, Chronos can reliably show the whole story, heatmap filtering/counts agree, and hidden Galaxy rendering stops.

## 2. Deliver one memorable discovery journey

The first signature feature. Begin with a small, carefully sourced collection rather than explanations for every reference.

- [x] Choose and verify a handful of strong cross-reference examples.
- [x] Add a clear **Discover a connection** entry point, building on Shuffle.
- [x] Gently dim surrounding references, illuminate the chosen thread, and clearly label both endpoints.
- [x] Show both passage texts with translation/source attribution and suitable usage rights.
- [x] Emphasize relevant shared language and provide a short, curated explanation of the relationship.
- [x] Add **Follow this thread** to continue through a related connection.
- [x] Add **Back to the whole**, restoring the previous filters and camera position.
- [x] Ensure the reading experience supports keyboard use, focus restoration, and reduced motion.

**Done when:** a visitor can discover a connection, understand why it matters, continue exploring, and return without losing their place. Review the experience with someone unfamiliar with the app.

## 3. Make exploration easier at every scale

Reveal detail as visitors approach it, with deliberate compositions for each view.

- [x] In Arcs, show book groups at overview scale and individual book names as space permits.
- [x] Give hovered/selected endpoints readable labels and generous selection targets.
- [x] Improve book search with explicit matches, selection feedback, and a clear no-results state.
- [x] In Galaxy, prioritize labels and prevent overlap; reveal more labels as the user focuses or zooms.
- [x] Make selected verse neighborhoods the clearest Galaxy state.
- [x] Refine bridge/edge density and brightness so enabling connections preserves visible structure.
- [x] In Heatmap, highlight the active row and column and show full book names.
- [x] Make heatmap cells selectable, opening the corresponding reference details.

**Done when:** users can identify and select a book, verse neighborhood, or book pair without deciphering tiny labels or navigating an unreadable mass of edges.

## 4. Welcome visitors and unify the interaction polish

- [x] Add a restrained first-visit invitation while keeping free exploration immediately available.
- [x] Offer three starting points: the sourced **Creation & light** journey, **Explore a book**, and **Compare two books**. Additional curated thematic journeys remain a future content expansion.
- [x] Establish consistent motion: immediate selection feedback, surrounding fade, camera reframing, then contextual text.
- [x] Make transitions interruptible and preserve orientation between states.
- [x] Apply reduced-motion preferences to ambient rotation, camera movement, entrance effects, and other transitions.
- [x] Use serif typography for titles/reading and monospace primarily for references/measurements.
- [x] Standardize tooltips, inspectors, dismiss actions, and recovery from empty/error states across views.

**Done when:** a new visitor can explain what they are seeing and reach a meaningful discovery within their first minute; transitions feel consistent and remain usable with reduced motion.

## 5. Connect discoveries across views

Build this after the individual discovery and exploration interactions are solid.

- [x] Carry selected books/passages and relevant context between Arcs, Heatmap, and Galaxy.
- [x] Add breadcrumbs and a reliable Back action for exploration history.
- [x] Encode meaningful selections in shareable URLs and restore them on reload.
- [x] Add curated links from passages to relevant Chronos context.
- [x] Clearly distinguish event dates from text composition dates; do not imply chronological certainty where none exists.
- [x] Surface data sources, estimated dates, and interpretive category assignments in the relevant details panels.

**Done when:** a visitor can follow one discovery across applicable views, retrace their steps, and share a link that restores the same meaningful context.

## 6. Complete the mobile and accessibility experience

Apply basic accessibility in every milestone; use this milestone for a thorough cross-device pass.

- [x] Design mobile around a focused visualization plus an expandable reading sheet.
- [x] Provide touch selection equivalents for hover interactions and usable gesture guidance.
- [x] Provide a keyboard-accessible, readable list alternative to canvas-only exploration.
- [x] Verify focus order, control names/states, Escape behavior, and focus restoration.
- [x] Check narrow screens, portrait/landscape changes, and long passage content in responsive browser viewports; check an effective 200% enlarged layout.
- [x] Confirm native browser/text enlargement, physical touch-device rotation, and screen-reader behavior.
- [x] Measure loading, interaction responsiveness, and rendering on representative lower-powered devices.
- [x] Add graceful fallbacks for unavailable 3D rendering and failed data loads.

**Done when:** the core discovery journey works with touch, keyboard, reduced motion, and a readable non-canvas path, with no blocked controls or lost context on small screens.

## Working rhythm

1. Pick one unchecked item or a small related group.
2. Define the exact user-visible outcome before implementing it.
3. Verify it in the affected views and input modes; record any remaining limitations.
4. Check off completed items and add a short dated note below.
5. Reassess priorities after the discovery journey is usable before starting broader cross-view integration.

## Progress notes

- **2026-10-15:** Captured the agreed design direction and incremental backlog. Assessment only; no experience changes implemented yet.

- **2026-10-15 (first implementation):** Added explanations for Rainbow’s three views, a heatmap brightness legend, category-specific counts shared by rendering and tooltips, visible keyboard focus, and Galaxy pause/resume for hidden views and background tabs. Added container resize handling for changing explanation/legend height. Chronos orientation and the broader control readability pass remain open. Production build and focused heatmap data assertions passed; full type-check currently reports missing Node and Vite environment types in the existing project configuration.

- **2026-10-15 (Chronos orientation):** Added Whole story and nine named era destinations; lowered the zoom floor to fit the viewport; first entry into Narrative/Lineage fits the chronology, while returning restores each view’s scale and scroll position. Aligned the date axis with views without lane labels, dismissed obstructing details during navigation, added explanations for Chronos views, and enlarged timeline controls with keyboard focus and pressed states. Chronos type-check/build passed. Desktop review covered Narrative overview and Divided Kingdom navigation; full mobile and accessibility verification remains open.

- **2026-10-16 (Rainbow control clarity):** Moved exploration controls into a dedicated row, enlarged primary controls and theme buttons, kept inactive themes legible, and emphasized Shuffle. Heatmap now hides arc-only search, shuffle, and camera presets. Added accessible names, selected states, grouped Galaxy controls, and native keyboard-operable layer switches. Production build and desktop browser checks passed, including Space to select a theme and Space/Enter to toggle Galaxy labels. Milestone 1 implementation items are complete; full mobile/accessibility validation remains in milestone 6. Next: milestone 2, one curated discovery journey.

- **2026-10-16 (first discovery journey):** Added a three-step Creation & light reading journey with full verses, highlighted language, editorial explanations, chapter links, previous/next/restart actions, and a native modal with focus restoration. Existing Shuffle remains available. Passage text verified against [Genesis 1](https://ebible.org/eng-web/GEN01.htm), [John 1](https://ebible.org/eng-web/JHN01.htm), and [2 Corinthians 4](https://ebible.org/eng-web/2CO04.htm), World English Bible Classic (public domain). These pairs were not found in the active dataset (subsequently confirmed as synthetic demo data), so they are explicitly labeled as curated readings and do not alter counts. The modal uses its own animated connecting arc, with reduced-motion support; linking the journey to highlighted endpoints in the main visualization remains open. Build and desktop forward/back/Escape checks passed; closing preserved the selected theme and returned focus to the entry button. A first-time visitor review and mobile verification are still needed before declaring milestone 2 complete.

- **2026-10-16 (remaining implementation):** Completed the highlighted discovery map, progressive book labels, explicit search results, selective Galaxy labels/neighborhoods, quieter edges, active heatmap rows/columns, selectable book pairs, first-visit entry points, reduced-motion handling, interruptible camera moves, shareable selections, exploration Back, sourced Chronos context links, searchable list alternatives, mobile reading sheets, and load/3D failure recovery. Shuffle now uses a native focus-trapping dialog. Chronos adds people search, an editable year, chronology assumptions, and compact responsive controls. Galaxy settings collapse to keep the visualization visible. Browser checks verified verse selection/reload, Back after reload, modal Escape/focus restoration, people search, and linked chronology destinations. Regression tests cover URL parsing, filtered counts, and worker failures; both production builds and Rainbow application type-check pass.
- **2026-10-16 (provenance correction):** Regenerating references in memory reproduced `public/references.json` byte for byte: the active graph is synthetic (seed 42), not an imported OpenBible graph. Corrected labels in the interface and README. Curated WEB Classic readings remain independently sourced. No dataset was replaced. A future switch to real cross-reference data requires adapting the separate importer output and reviewing provenance.
- **2026-10-16 (validation boundary):** Reviewed 390×844 portrait and 844×390 landscape containers, stacked passage content, compact headers, and scrollable layouts. This is desktop responsive review, not physical touch-device or low-power performance measurement. Text enlargement, screen-reader testing, physical-device rotation, and an unfamiliar visitor review remain to be completed. See [EXPERIENCE-VALIDATION.md](EXPERIENCE-VALIDATION.md) for evidence and exact next checks.

- **2026-10-17 (final local verification):** Fixed landscape reading-sheet overlap, kept reading actions pinned during scrolling, aligned mobile focus order, and replaced crowded heatmap abbreviations with readable testament labels at small sizes. Selected book pairs now focus both books and their connections in Galaxy, including reload and retry. Verified browser network failures, reading access while the graph is unavailable, both network retries, WebGL fallback/recovery, long readings at an effective 200% layout, and same-viewport rotation without lost selection. Local timing and hidden-render measurements are recorded in EXPERIENCE-VALIDATION.md. All six milestones have their implementation delivered; remaining acceptance checks require physical devices, native assistive technology/zoom, or an unfamiliar visitor and are not marked complete.

- **2026-10-18 (user sign-off):** User confirmed all remaining checks are done, covering physical-device use/rotation, native zoom and screen-reader behavior, lower-powered-device performance, and unfamiliar-visitor review. All six milestones are complete. Device details and additional measurements were not supplied; this records user confirmation rather than additional agent-run tests.
