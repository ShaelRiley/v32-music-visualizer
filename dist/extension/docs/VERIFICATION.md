# Verification — Video32 0.2.1

## Current panorama and capture repair

Verified on 2026-10-09 with Node 24.19.0 and Chromium headless shell 151.0.7922.34. Graphics use software SwiftShader. Started from published 0.2.0 commit `2ede9b7e442d9983f7e698c7f21b774ac5fc716f`.

| Area | Current evidence and result |
| --- | --- |
| Node suite | **24 tests passed**, zero failures. Covers unchanged canonical glyph bytes, palette parity, preset IDs, source hashes, full-circle cameras, native audio ownership, fixed-format tracks, processing bypasses, failure cleanup and MV3 routing. |
| Full source coverage | All 256 bundled fabrics decode to 256×576 pixels (nine 256×64 frames), with glyph IDs 0–31 and verified derived hashes. First and last frames compared with every complete source panorama: 512 frames, **8,388,608 matching RGB565 cells**, every source longitude retained. Original source acquisition hashes and CRCs remain pinned. |
| Complete sphere rendering | **256 studies × four cardinal headings = 1,024 lossless renderer checks**, zero off-palette pixels, invalid glyph IDs or JavaScript/WebGL errors. A full turn produces the same image; the rear view differs; source-frame progression changes the drawing. Rendering stays at the 8,000-mark cap. |
| Source fades | `vr-sphere-259085942` has a genuine dark source fade already present in 0.2.0. Its source frames 4–5 contain only Void after matching. Runtime preserves the fade; its preview shows four headings of the opening frame. No scene detail was invented to make the test nonempty. |
| Native captured playback | A real stereo MediaStream plays through a native audio element at volume 1, unmuted, with analysis on a separate graph. Six synthetic tones (35, 220, 1,000, 2,700, 9,000 and 13,000 Hz) had **0 dB measured level difference** between direct and monitored streams. The other-channel level was more than 130 dB lower at those tones. Analysis continued, and Stop released the player and track. This measures digital tone fidelity, not physical listening, phase alignment or full Chrome tabCapture permission behavior. |
| Audio lifecycle | Twenty capture cycles use one native monitor, no captured Web Audio destination route, explicit processing bypasses and stream-format retention. Monitor failure, rejected processing settings and source termination release resources. Fixed unprocessed streams are not unnecessarily reconfigured. |
| UI regression | Retention, saved favorites, JSON export/import, invalid import handling, local-file playback, Pause, Hold, history limit and all three bank startup modes passed with the revised runtime. |
| Built runtime | Web-served `dist/extension` passed 768-entry catalog, finite-color output, True Color, default bank alternation, source credits and representative source fabrics from every polygon category and the complete video bank. This does not exercise MV3 permissions. |
| Installable ZIP | All 122 entries and CRCs match the unpacked 0.2.1 runtime byte for byte. The recorded hash is checked again by the repository packaging job. |
| Preview atlas | Four video PNG sheets and four animated sheets regenerated from the complete sphere at headings 0°, 90°, 180° and 270°. Eight studies also appear in the lossless four-heading comparison `previews/spatial/full-360.png`. Polygon and regular preview images are retained. |

The previous captured playback route was a direct Web Audio source-to-destination connection in an AudioContext with the browser's default latency and sample rate. Chrome redirects ordinary tab playback when capture starts, so that relay determines the heard output. This repair uses one native media player, requests speech processing off, checks reported settings, and isolates analysis from playback. The reported tinny/warbly artifact was not reproduced on the user's hardware; its precise cause remains unconfirmed. The digital measurements do not establish that processing was enabled in the previous version or guarantee a particular hardware driver result.

Current evidence: `node-test-results.txt`, `panorama-source-report.json`, `panorama-report.json`, `audio-fidelity-report.json` and `ui-report.json`. The package checks below are refreshed for this version. Reports for unchanged visual systems remain version 0.2.0 measurements.

## Retained 0.2.0 visual verification

The following measurements document the prior visual revision. In particular, old video framing/stage measurements and the old audio ownership route are historical; the current full-sphere and capture evidence is above.

Verified on 2026-10-08–09 in a Linux execution container with Node 24.19.0, Playwright 1.62.1, Sharp 0.35.4 and Chromium headless shell 151.0.7922.34. Graphics were ANGLE/Vulkan **software SwiftShader**, without a physical GPU or listening device. Browser tests use the development adapter and diagnostic drawing-buffer readbacks.

The published 0.1.0 baseline was commit `2a01390ee0cca552951c5fa62b7d73bbd7fc2115`; remote main had not advanced when inspected. The user installed it, confirmed that it works, and liked it. This establishes a working user baseline, while particular capture routes, physical stereo, cleanup, native fullscreen and sustained Steam Deck performance remain separately qualified observations. The 0.2.0 revision preserved baseline audio ownership and MV3 source routing; 0.2.1 changes captured playback as documented above.

## Completed checks

| Area | Evidence and result |
| --- | --- |
| Node suite | **20 tests passed**, zero failures; the original 11 passed before revision. Canonical imports, original palette parity, scheduler, audio ownership and MV3 routing checks remain. |
| Canonical alphabet | Exactly 512 selected source bytes; indices 0–31 in order, original 8×16 masks and aspect, including Void. Bitmap and atlas pixels agree with the pinned masks. No font substitution or extra glyphs. |
| Historical palette port | All 55 original registry entries and 15 depth choices remain inventoried and compared with original source functions. Native Glyph remains explicitly unavailable. This is separate from the curated picker. |
| Curated color system | 37 applicable treatments: 20 new themes and 17 retained distinct treatments. Palette paths, bounded unique finite colors and applicable-palette shuffle passed. |
| GPU grading | 74 palette/depth checks × 512 RGB inputs = **37,888 exact GPU/CPU matches**, including finite output and True Color. Zero mismatches or off-palette finite outputs. |
| Finite regular artwork | All 37 applicable palettes at depth 16 plus all 14 finite Standard depths: 51 framebuffer checks, zero off-palette pixels. Interface colors excluded. |
| Final display | DPR 1, 1.25 and 2 × internal scale 0.55, 0.7, 0.9 and 1: 12 lossless screenshot checks, plus three fixed-time palette changes. Zero off-palette pixels. |
| Regular repertoire | All 256 original IDs across 32 families rendered at 0, 2.5, 8 and 23 seconds. Nonempty, evolving frames, valid forms and bounded coordinates; zero JavaScript/WebGL errors. Structural fingerprints remain distinct. |
| Regular framing | First preset of each family sampled at 7 seconds, 640×360 and an 8,500-mark cap. Mean occupied 40×40-pixel regions improved from 22.98% to 56.66%; all 32 improved. Minimum revised sample 41.67%. This measures regions containing any mark, not filled pixel area or a guarantee for every moment. |
| Sustained musical response | At fixed time, quiet versus sustained synthetic music with onset zero, 128 samples per layer and a 6,500-mark cap. Every regular preset moved at least 99.48% of valid sampled marks by more than 0.02 world units. Zero audio-induced color changes. |
| Fluid movement | Drawing changed between 30 Hz analysis ticks while retaining the same analysis pose; midpoint position interpolation was 0.5. Three-axis deformation and internal bending passed CPU tests. Categorical glyphs are not interpolated. |
| Spatial sources | 32 licensed polygon/elevation sources × eight tours = 256 presets. Retained source hashes, point-fabric hashes, finite coordinates, surface classes, normalized normals and closed finite camera rails passed. Artistic routes are not collision certified. |
| Video sources | 256 distinct recorded original videos, nine frames each, only source licence families CC BY / CC BY-SA / CC0. Frame SHA-256/CRC acquisition proofs and derived fabric hashes retained. Dataset/adaptations are CC BY-SA 4.0; full source credits and licence are bundled. |
| Spatial rendering | All 256 polygon and 256 video presets rendered at 0, 7 and 23 seconds with an 8,000-mark cap. All were nonempty and evolved; zero off-palette pixels or JavaScript/WebGL errors. IDs were integers 0–31. Video used all 32 canonical forms across the bank; polygon matching used 18. |
| Spatial extent | At the 7-second samples, mean occupied regions were 85.29% for polygon tours and 97.74% for video studies. These are region-occupancy diagnostics, not percentages of filled pixels. |
| Spatial musical response | 64 representative scenes, 128 sampled marks each, sustained features with onset zero. Minimum moved share 92.97%, zero audio-induced color changes, zero WebGL errors. |
| Async resources | Twelve rapid polygon/video replacements retained the intended final scene. Decoded caches stayed within eight polygon and four video entries; each compressed-fabric cache retains at most two local bundles. Shader programs remain constant. |
| Default show | A deterministic 1,024-selection run alternated regular and spatial scenes, with 512 regular / 256 polygon / 256 video selections. Every bank completed its shuffled traversal without an early repeat. Canceled choices were restored. Discovery is excluded from this default. |
| Palette cycling | Default on; automatic selections change palette and disabling cycling retains it. Manual/history selection does not cycle. Disabled preference survived reload in all three bank modes. |
| Optional mixed scheduler | 3,600 selections, 45.06 simulated viewing hours, 50.0009% regular authored time, seven complete regular traversals, maximum automatic streak two. Hold, manual, hidden time and Pause exclusions retained. This is a simulation, not a 45-hour browser run. |
| Discovery | 1,000 reproducible seeds, zero accepted structural duplicates or fallbacks. 126 candidates rejected for insufficient estimated screen span and replaced within the bounded attempt budget. Every seed CPU-validated; 32 representative worlds GPU-rendered. |
| GPU/CPU spatial equations | 32 operator checks; maximum coordinate difference 0.000614 world units. |
| Audio baseline | Synthetic silence, noise, sustained tones, transients, irregular rhythm and stereo features stayed bounded. Ownership mocks covered 20 start/stop cycles, one intended monitor route, cleanup and failure paths. MV3 routing mocks retained source selection, viewer reuse and lifecycle cleanup. |
| Browser file playback | Reopening a local audio file succeeded; playback advanced and Stop returned to idle. Pause froze visual time while audio continued. No physical listening or stereo-output observation was made. |
| Retention and three-bank UI | 768-entry searchable catalog, 256 entries per bank filter, favorites/saved Discovery after reload, mode/palette restoration, JSON export/import, invalid-import retention, Hold animation and 40-entry history passed. Each authored bank loaded after reload. Linked credits listed 32 polygon sources and 256 video sources. Resize passed. |
| Fullscreen idle | After 2.3 seconds idle plus the fade, every overlay was invisible and inert, cursor hidden, and newly issued messages remained hidden. Mouse/key revealed controls; fullscreen exit restored them. **Native fullscreen did not enter**; this check used DOM fullscreen-state emulation, with paused imagery. |
| Built extension and ZIP | Web-served `dist/extension` retained all 768 entries, the flagship's 8,500-mark base budget, exact finite output, True Color bypass, representative source fabrics from every polygon source category and video data, default alternation and linked credits. ZIP CRCs and every entry byte were compared with the unpacked build. This does not test MV3 capture permissions. |

Discovery generation median **1.186 ms**, p95 **2.165 ms**, maximum **5.222 ms** in the CPU harness. These cover declarative generation and quality checks, not drawing or shader compilation.

## Software performance diagnostics

The **60 FPS hardware target remains unverified**. The available software backend did not reach it. Quality labels specify caps. These measurements cannot predict integrated-GPU or Steam Deck performance.

The following run used the flagship with explicit budgets, 60 requestAnimationFrame intervals after warm-up, and no simultaneous browser harness, gallery encoding or asset uploading. Production also honors the scene's base budget and adaptive settings. Container scheduling and SwiftShader remain part of the result.

| Profile | Marks | Internal resolution | Median interval | p95 interval | Maximum |
| --- | ---: | --- | ---: | ---: | ---: |
| Low | 4,500 | 896×503 | 50.1 ms | 66.7 ms | 83.4 ms |
| Balanced | 9,000 | 1152×648 | 133.4 ms | 200.0 ms | 216.7 ms |
| High | 16,000 | 1280×720 | 316.7 ms | 366.7 ms | 366.7 ms |

A separate 10,000-mark, 1280×720 render-plus-synchronous-readback diagnostic measured median **174.4 ms**, p95 **228.7 ms**, maximum **263.1 ms**. Readback forces completion and adds overhead absent from production playback.

Across 64 regular/Discovery replacements, replacement plus the first low-cost frame and synchronous readback measured median **90.6 ms**, p95 **103.3 ms**, maximum **106.0 ms**. Tracked GPU resources followed **5×layer count+7**, maximum 27; two shader programs remain constant. This verifies bounded allocation/deletion behavior, not a memory profiler or a multi-hour endurance run. New spatial caches and replacement races are checked separately above.

## Artwork, licensing and video scope

The atlas covers all 768 presets. Twelve PNG sheets identify every preset; polygon animated sheets sample three stages and current video sheets show four viewing headings. Regular individual previews sample four stages. Spatial individual thumbnails are reproducible intermediates excluded from the source archive. The 12-second MP4 uses 96 actual rendered frames at eight samples per second with simulated music. It is an inspection video, not an achieved-FPS recording or palette-count test; MP4 and WebP compression can add colors, including in sheets assembled from WebP previews. Palette proofs use original lossless artwork and screenshots.

The fixed-glyph comparison substitutes canonical Full Block, index 7, while retaining the world, features, time and camera. Its fabric and porosity differ from the normal composed forms. Structural fingerprints and visual inspections do not mathematically certify artistic uniqueness.

The user revised the video request to complete 360° studies. All 256 now retain the complete panorama. Native VR180 media found during earlier research was gated and was not downloaded. Each study uses nine consecutive source frames and an artistic slow forward/reverse loop; the dataset does not provide source cadence. There is no full-length movie, stereo, inferred depth or six-degree-of-freedom reconstruction. RGB565 is the source-color representation before treatment. Original licence families and available source metadata are retained, without a claim of an independent current-page rights audit.

Polygon tours use mapped exterior building masses, static open game level geometry, fixed model neighborhoods and measured elevation. The Louvre entry is not a scanned interior or museum walkthrough. Source-derived data and previews retain their separate licences. See [SPATIAL-SOURCES.md](SPATIAL-SOURCES.md), [NOTICES.md](NOTICES.md) and the bundled source page for credits, hashes, adaptations and regeneration.

## Remaining device observations

Full Chrome could not start because process-singleton Unix socket creation was denied in the container. The headless shell supported WebGL2, Web Audio and DOM checks, but no interactive extension capture chooser or physical fullscreen qualification. Record specific observations during ordinary Chrome testing:

1. Play a stereo test in the source tab and click Video32 there. Record the selected source, offscreen capture, once-audible output and independent listening volume.
2. Repeat Capture/Stop, change sources, deny or cancel capture, close source/viewer and restart Chrome. Record cleanup and restoration of ordinary source playback.
3. Exercise tab and available screen/system sharing through the actual chooser. Record returned audio tracks and browser/OS capabilities. No microphone fallback is introduced.
4. Enter native fullscreen; check that all controls/messages/cursor fade after inactivity, return on interaction and restore after exit. Include paused imagery, resize and source changes.
5. Profile integrated graphics and Steam Deck/Linux at 1280×720 with real music, long sessions, frame distributions, thermal behavior and resource growth. Report actual hardware and browser versions.

Discovery quality estimates are bounded analytic checks, with representative rather than 1,000 GPU renders. Browser/OS permissions and protected media may reject capture; restrictions were not bypassed. The user's successful baseline remains recognized without expanding that observation into unmeasured hardware claims. Neither upstream repository nor the Chrome Web Store was changed.

## Reproduction and evidence

```sh
npm ci
npm test
npx playwright install chromium
npm run verify:browser
npm run verify:color
npm run verify:display
npm run verify:ui
npm run verify:revision
npm run verify:spatial
npm run verify:panorama
npm run verify:audio
python3 tools/verify-vr-coverage.py /path/to/video32-source-frames
npm run measure
npm run gallery
npm run build
npm run package
node tools/package-qa.mjs dist/extension
python3 tools/zip-qa.py --record
```

Set `V32_BROWSER` to an existing compatible Chromium executable when needed. Each browser harness starts a local server; run them sequentially. Chromium, Playwright, Sharp and optional importer Python dependencies are absent from runtime installation. Normal builds use retained local assets and require no source download. The packaging workflow uses pinned checkout/setup-node actions and Node 24.19.0 to regenerate large archives from the verified committed runtime; it compares the output with the recorded ZIP SHA-256 before committing. This is a publication transport path, not a runtime requirement.

Raw reports: `panorama-report.json`, `panorama-source-report.json`, `audio-fidelity-report.json`, `node-test-results.txt`, `discovery-report.json`, `scheduler-report.json`, `browser-report.json`, `color-gpu-report.json`, `final-display-report.json`, `ui-report.json`, `revision-report.json`, `baseline-framing-report.json`, `spatial-report.json`, `performance-report.json`, `package-runtime-report.json`, `zip-report.json` and `preset-inventory.json`. Upstream commit/hash provenance is in `assets/provenance.json`; source-derived manifests and retained acquisition records provide data proofs.
