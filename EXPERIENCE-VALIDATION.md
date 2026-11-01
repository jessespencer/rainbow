# Experience validation — October 18, 2026

Branch: `codex/experience-improvements`. Changes remain local and uncommitted.

## Automated checks

- `pnpm build`: both applications pass. Chronos includes TypeScript checking.
- `pnpm --filter rainbow typecheck`: application TypeScript passes using the new application-only configuration. The older configuration also includes standalone scripts and has missing Node declarations; those scripts were not migrated.
- `pnpm --filter rainbow test:experience`: passes URL round trips, invalid URL parameters, mirrored heatmap counts, diagonal counts, theme filtering/dominance, and empty selections. Worker tests exercise network failure, failed HTTP responses, invalid data, and successful binning.
- `git diff --check`: passes.
- Galaxy remains an on-demand chunk of about 534 kB minified (136 kB gzip). Vite reports its size warning; this is not a measured device-performance result.

## Browser review

- Search exposes explicit matches and an empty result message.
- Explore references: John → book pairs/verse list → John 1:1 opens Galaxy with the matching breadcrumb, details, and URL. Reload restores it. Back after reload returns to the prior Arcs context.
- Heatmap book-pair selection displays its count and individual verse buttons. Switching to Galaxy carries both books into the focused scene, dims surrounding nodes, and shows density-adjusted pair connections; reload restores this context. Category-specific aggregation has separate regression coverage.
- Discovery: forward/back navigation, full sourced passages, highlighted book endpoints, native modal focus, Escape, and return to the previous view. Curated links target the correct Chronos view and era.
- Shuffle: native modal, initial button focus, Escape closes and restores focus to Shuffle.
- Chronos: Narrative/Messianic URL frames the expected era; people search for Mary returns one result; Show in context positions the timeline and updates the year/details.
- Responsive review used temporary 390×844 and 844×390 iframe viewports. Headers, toolbars, stacked passages, and scrollable layouts were inspected. Rotation within the same viewport retained the selected pair and expanded reading sheet. Fixed header overlap in landscape and pinned close/expand actions while scrolling. Temporary fixtures were removed after review.

- Long discovery readings and their footer actions were checked at an effective 200% layout (640×336 viewport enlarged to 1280×672); Chronos people search also remained accessible. This simulated layout is not native browser/text zoom. Native browser control stalled, so it was not completed by the agent; subsequent user sign-off is recorded below.
- Injected a failed reference request in-browser: the focused error dialog isolates Retry loading and Read curated connections. Readings remain usable without the graph, a persistent Retry map action remains after dismissal, and both retry paths recovered the demo count.
- Injected unavailable WebGL: the fallback hides unusable Galaxy controls. Restoring WebGL and choosing Retry 3D restores rendering and context.

## Local responsiveness sample

A temporary development fixture measured 115 ms to worker-ready, 71 ms from Galaxy click to its first draw, and a 0.3 ms p95 synchronous animation callback across 883 samples. After switching to Arcs, hidden Galaxy draw calls remained zero. These are one local development run with potentially cached assets, not cold production-network, GPU-completion, frame-rate, battery, or lower-powered-device measurements. The instrumentation was removed.

## Human/device validation — user confirmed complete

On October 18, 2026, the user confirmed all remaining checks below were complete. This is user-reported sign-off; device details, measurements, and review notes were not supplied. The following list preserves the acceptance scope.

1. On a physical phone/tablet, run the discovery journey, select a heatmap pair via the list, expand/collapse the reading sheet, and rotate portrait/landscape. Check pinch, scrolling, and browser chrome changes.
2. At 200% text/browser zoom, check both apps, long readings, and modal action access. Check with VoiceOver or another screen reader in addition to the accessibility-tree and keyboard checks already performed.
3. On a representative lower-powered device, record cold-load time, time to first Galaxy frame, responsiveness during orbit/selection, and background power behavior. Browser failure/retry checks and worker regression tests have passed locally.
4. Ask someone unfamiliar with the apps to explain each view, discover a sourced connection, return to their previous context, and share a selection. Record confusion and time to first discovery.

## Data provenance

The active `apps/rainbow/public/references.json` was compared with the seeded generator output produced in memory, with filesystem writes intercepted. Exact equality was confirmed. Its 63,779 connections are synthetic demo data, not verified cross-references. The separate OpenBible parser writes a different file/format, currently unused by the application.

The UI and READMEs now state this explicitly. The graph was not replaced. The curated World English Bible Classic readings are separately sourced and do not contribute to graph counts. A real-data migration is a separate follow-up requiring an adapter, validation of references, and source/license review.
