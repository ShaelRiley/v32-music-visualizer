# Verification — Video32 0.1.0

Verified on 2026-10-08 in a Linux execution container with Node 24.19.0, Playwright 1.62.1, Sharp 0.35.4 and Chromium headless shell 151.0.7922.34. Graphics were ANGLE/Vulkan **software SwiftShader**, with no physical GPU or listening device. Browser tests used the development adapter, which preserves the drawing buffer for diagnostics.

This is a runnable implementation and public 0.1.0 device-test build. Actual extension capture and device qualification remain release checks; these reports do not establish a fully device-qualified release.

## Completed checks

| Area | Evidence and result |
| --- | --- |
| Canonical alphabet | Exactly 512 selected source bytes; indices 0–31 in order, 8×16 masks, Void included. Every bitmap and atlas pixel agrees with the pinned canonical masks. |
| Palette port | All 55 registry entries and 15 depth choices compared with original source functions. Palette arrays, 5-bit lookup arrays and representative grading outputs agree exactly. Native Glyph is identified as unavailable. |
| GPU grading | 108 palette/depth checks × 512 RGB inputs = 55,296 comparisons. All 27,648 finite outputs exactly matched the CPU functions. One Apple IIe True Color input differed by one 8-bit channel value; all other comparisons matched exactly. This is the documented GPU rounding tolerance. |
| Final finite artwork | All 54 applicable palettes at depth 16, plus all 14 finite depths of Standard: 68 framebuffer tests, zero off-palette pixels. Interface colors were excluded. |
| Final display | Lossless browser screenshots at DPR 1, 1.25 and 2, with internal scale 0.55, 0.7, 0.9 and 1: 12 tests, zero off-palette pixels. Three fixed-time palette-change checks also passed; cached old colors did not survive the first new draw. |
| Authored repertoire | 256 named IDs, 32 families, 256 structural fingerprints. Every scene rendered at 0, 2.5, 8 and 23 seconds and changed at multiple stages. All coordinates and glyph IDs were bounded; no browser JavaScript or WebGL errors. |
| Spatial equations | 32 GPU/CPU operator checks; largest coordinate difference 0.000576 world units. |
| Discovery | 1,000 reproducible seeds, zero accepted structural duplicates, zero fallbacks. 63 candidates rejected for insufficient estimated negative space and replaced within the bounded attempt budget. Every seed was CPU-validated; 32 representative generated worlds were also GPU-rendered. |
| Mixed scheduler | 3,600 selections, 45.06 simulated viewing hours, 50.0009% authored time, seven complete 256-scene traversals, maximum automatic streak two. Holds, manual overrides, hidden time and pauses were excluded. This was a scheduler simulation, not a 45-hour browser run. |
| Audio features | Generated silence, low noise, bass, transients, sustained tones, irregular rhythms, quiet passages and stereo changes remained bounded. No instrument-identification claims. |
| Audio ownership | API mocks: 20 start/stop cycles, exactly one stereo monitor branch when required, track/node/context cleanup, source termination and failed file playback. Separate MV3 routing mock verifies intended source selection, viewer reuse, permission-error cleanup and source/viewer removal. |
| Real browser file input | Web Audio file playback advanced, repeated file opening succeeded, Stop returned to idle. Pause froze visual time while the file continued advancing. Sound and physical stereo output were not listened to. |
| Retention/UI | Searchable 256-entry catalog; Discovery saving and favorites survived reload; saved mode/palette restored; export/import recovered the world; invalid import retained the existing world; Hold retained animation; recent history stayed bounded at 40. Resize passed. |
| Node suite | 11 tests passed, zero failures. Raw output is in node-test-results.txt. |

Discovery generation median: **0.194 ms**; p95 **0.429 ms**; maximum **1.135 ms** in this CPU harness. These timings cover declarative generation and quality checks, not shader compilation or drawing.

## Performance measurements

The 60 FPS integrated-GPU target at 1280×720 remains **unverified**. The available software backend did not reach it. Quality-menu FPS values are caps, not achieved-rate promises. Diagnostic profiles set explicit sample budgets on the flagship world; normal playback also honors each scene’s base budget before applying the density control.

Each row measures 60 requestAnimationFrame intervals after warm-up. It reflects the headless software renderer and container scheduling. A final-display probe shared the container during part of this run; these are development diagnostics, not isolated hardware benchmarks.

| Profile | Marks | Internal resolution | Median interval | p95 interval | Maximum |
| --- | ---: | --- | ---: | ---: | ---: |
| Low | 4,500 | 896×503 | 50.1 ms | 116.6 ms | 116.7 ms |
| Balanced | 9,000 | 1152×648 | 133.4 ms | 200.0 ms | 216.7 ms |
| High | 16,000 | 1280×720 | 166.8 ms | 266.7 ms | 350.0 ms |

A separate 10,000-mark, 1280×720 render-and-synchronous-readback test measured median **107.0 ms**, p95 **165.7 ms**, maximum **179.8 ms**. Readback forces GPU completion and adds overhead that production playback does not use. The raw report explicitly leaves target60fpsVerified false.

Across 64 authored/Discovery replacements, scene replacement plus the first low-cost frame and synchronous readback measured median **51.9 ms**, p95 **77.8 ms**, maximum **96.6 ms**. Tracked buffers, vertex arrays, transform-feedback objects and textures remained at 5×layer count+5 (maximum 30); two shader programs remain constant. The check verifies the bounded allocation/deletion model, not a full device memory profiler or a multi-hour GPU endurance run.

## Artwork inspection and preview scope

Four contact sheets connect all 256 scenes to their stable IDs. The static atlas includes a four-stage sampled animation for every preset, descriptions, structural recipes and intended audio mappings. The 12-second MP4 uses 96 actual rendered frames at eight samples per second with clearly simulated musical features. It is not a real-time performance recording or a palette-count test: video compression introduces colors.

Contact-sheet review exposed chamber views that initially looked outward or cropped away the enclosing geometry. The camera now establishes the enclosing structure before moving inside and returning. Conical intersections, edge cages, cell clusters, woven surfaces and branching scenes are separately visible. Shared vocabulary and intentional composition archetypes remain; structural fingerprints reduce repeats but do not mathematically certify artistic uniqueness.

The fixed-glyph comparison replaces all marks with canonical Full Block, index 7, while keeping the world, features, time and camera fixed. The normal and fixed images visibly differ in fabric, silhouette occupancy and porosity. This demonstrates form’s contribution to the aggregate; it does not claim the composition has a uniquely optimal matching rule.

## Remaining device checks and precise limits

Full Chrome could not start in this execution container because process-singleton Unix socket creation was denied. The headless shell was sufficient for WebGL2, Web Audio and DOM checks, but did not provide an interactive extension capture/permission workflow. Its fullscreen request did not enter fullscreen.

The following are implemented but still require ordinary Chrome/device verification:

1. Load the unpacked extension, play a stereo test file in a source tab and click the extension there. Confirm the source identity, offscreen capture, once-audible output and independent listening volume.
2. Repeat capture/Stop, change sources, cancel or deny a request, close the source and visualizer, and restart Chrome. Confirm cleanup and that stopping capture restores the source’s ordinary audible playback.
3. Exercise browser-tab and available screen/system sharing using the actual chooser. Check returned audio tracks and OS capability messages. There is no microphone fallback; system audio is not universally available.
4. Verify fullscreen, resizing, hide/reveal and source changes in the real extension context.
5. Profile integrated graphics and Steam Deck/Linux at 1280×720 with real music, long mixed sessions, frame-time distributions, thermal behavior and memory/resource growth. The software measurements above cannot predict those device results.

Discovery visibility/negative-space tests are bounded analytic estimates, with representative GPU checks rather than GPU rendering of all 1,000 seeds. Audio playback was exercised without a listening test. Browser/OS permissions and protected media can reject capture. Those boundaries are reported, not bypassed.

The original WhiteCap edition’s actual bundled authored-scene count remains unverified. Current official pages do not establish that original count separately from combinations or later effect offerings, so the specified floor stays 256. No WhiteCap imagery, presets or code was copied.

## Reproduction and evidence

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run verify:browser
npm run verify:color
npm run verify:display
npm run verify:ui
npm run measure
npm run gallery
npm run package
node tools/package-qa.mjs dist/extension
```

Set V32_BROWSER to an existing compatible Chromium executable when needed. Every browser harness starts its own local server. Chromium and development packages are not bundled with the extension. The importer is optional, commit-pinned and requires the sibling upstream checkouts; normal builds use the retained assets and tables.

The built extension directory also passed its own web-served runtime check: all 256 scenes were present, the flagship honored its 8,500-mark base budget, finite output stayed on palette, and True Color produced more than 256 colors without using the finite lookup. ZIP entries and CRCs were checked; runtime packaging excludes tests, upstream vendor code, previews and developer tools. This build smoke test does not verify MV3 capture.

Raw evidence: package-runtime-report.json, node-test-results.txt, discovery-report.json, scheduler-report.json, browser-report.json, color-gpu-report.json, final-display-report.json, ui-report.json, performance-report.json and preset-inventory.json. Commit IDs, SHA-256 hashes, special-mode distinctions and notices are in assets/provenance.json and NOTICES.md.

Architecture references checked during implementation:

- [Chrome tabCapture API](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)
- [Chrome extension screen capture](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture)
- [Chrome offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
- [SoundSpectrum WhiteCap](https://www.soundspectrum.com/whitecap/)
- [SoundSpectrum WhiteCap overview](https://www.soundspectrum.com/whitecap/about.html)
