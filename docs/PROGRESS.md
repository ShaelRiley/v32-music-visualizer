# Progress ledger — 2026-10-08–09

## Working baseline and revision

Remote `main` and release `v0.1.0` were inspected before editing. Both pointed to `2a01390ee0cca552951c5fa62b7d73bbd7fc2115`; there was no newer remote work to reconcile. Repository instructions, README, progress, verification and relevant source were read. No additional repository instruction file was present. The baseline's 11 Node tests passed before revision.

The user installed the published build, confirmed that it works, and liked it. That establishes a working user baseline. It does not independently establish particular stereo routes, capture cleanup, native fullscreen behavior or sustained Steam Deck performance. Those observations remain separate qualification items.

Version **0.2.0** retains the canonical glyphs, MV3/offscreen audio ownership, 256 regular scene IDs, optional structural Discovery, retention/import/export and finite-color discipline. The revised library contains **768 creations**: 256 regular, 256 polygon tours and 256 spherical video studies. Runtime installation still needs no compilation, npm, account or server. The committed unpacked build and ZIP are updated together.

## Completed revision increments

1. Combined sustained band/level/trend activity with individual layer mappings. Most marks now respond between beats. Three-axis deformation bends forms internally, and GPU position interpolation supplies movement between analysis ticks.
2. Removed audio-dependent mark brightness and presence. Beats rotate marks and gently change their size. Colors remain attached to scene structure while geometry bends.
3. Enlarged and reframed regular compositions. All 32 sampled family views occupied more screen regions than the released baseline. Discovery 1.1 generates sweeping landscapes, tunnels, archways, asteroid fields, orbital passages and crossings, with bounded quality rejection.
4. Curated 37 applicable palette treatments: 20 new themes and 17 distinctive retained treatments. Kept the original 55-entry inventory for provenance. Added scene color roles, surface classes and height bands instead of random color scattering. Exact finite output and True Color bypass remain intact.
5. Made the default show library-only: regular scenes alternate with spatial scenes; polygon and video banks are shuffled through the spatial slots. Each bank has a complete shuffled traversal. First regular selection is randomized. Automatic palette cycling defaults on and can be disabled; Discovery remains explicit. The optional elapsed-time 50/50 regular/Discovery mode is retained.
6. Added fullscreen inactivity fading after 2.3 seconds. Controls, captions, messages, backdrop and cursor disappear, including while imagery is paused, and return on interaction. DOM behavior is verified; native fullscreen still needs a device observation.
7. Researched and retained licensed spatial sources. Eight OSM districts include the Louvre precinct; twelve actual Freedoom levels, eight CC0 house neighborhoods and four measured US terrain regions complete 32 source spaces. Each has eight guided tours. Offline sampling and bounded local caches avoid runtime mesh parsing and remote requests.
8. Added 256 studies from distinct licensed UGC360 source videos. Public archive ranges, original frame hashes/CRCs, source links and available creator metadata are retained. The matcher selects all 32 original glyphs across the bank. Sources, adaptations and full data licences accompany the build.
9. Corrected startup/automatic selection and verified canceled queue restoration, all three bank startup modes, palette-cycle preference retention, asset replacement races, catalog filters and linked source credits. Refreshed the complete atlas, twelve contact sheets, eight animated spatial sheets and actual-renderer preview video.
10. Ran the revised Node, renderer, color, display, UI, motion/fullscreen and packaged-build checks. Rebuilt `dist/extension` with `npm run build`; regenerated `dist/Video32-Chrome-Extension.zip` and checked its contents against the unpacked build. Added a pinned repository packaging job that reconstructs the large ZIP from the verified committed runtime and checks the recorded hash before committing it; the connected GitHub uploader has a 16 MiB request limit.

## Verified state and remaining scope

Twenty Node tests passed. All 768 presets rendered at their documented development stages without JavaScript/WebGL errors, with valid glyph IDs and exact finite palette output. The color GPU/CPU check matched all 37,888 comparisons exactly. Retention, JSON import/export, file playback, Pause, Hold, palette cycling, three-bank startup, motion interpolation and fullscreen idle DOM behavior passed. Raw evidence and measurement scope are in [VERIFICATION.md](VERIFICATION.md).

The native VR180 collection found during research has gated media. The bundled video bank therefore uses **nine-frame 360° sequences viewed through 180°**, without depth reconstruction, stereo or full-length movie playback. This is an explicit interpretation, not completion of the request for 256 reusable native VR180 movies. Polygon tours are artistic guided routes rather than collision-certified museum walkthroughs; the Louvre reconstruction uses mapped exterior masses.

Full Chrome could not launch in the container because process-singleton Unix socket creation was denied. Physical stereo/once-audible routing, capture lifecycle and restoration, actual sharing permissions, native fullscreen and sustained integrated-GPU/Steam Deck performance remain device checks. **60 FPS is a target, not a measured hardware result.** Record specific hardware/browser/listening observations when testing the revision. No upstream repository or Chrome Web Store listing was changed.

## Update an installed checkout

```sh
git -C ~/Downloads/v32-music-visualizer pull --ff-only
```

Stop capture, reload Video32 at `chrome://extensions`, close the old viewer, and reopen it from the playing music tab.
