# Video32 Music Visualizer

A local Chrome instrument for form-extended pointillism: luminous spatial structures built directly from Shael Riley’s canonical 32 bitmap forms. Ships 768 creations in three banks: 256 regular formations in 32 families, 256 polygon/elevation tours and 256 spherical video studies. Structural Discovery remains available explicitly.

## Get the ready-to-load build from GitHub

The committed `dist/extension` folder is already built; `dist/Video32-Chrome-Extension.zip` is the same installable build in an archive. Using the Chrome extension requires **no Node, npm, compilation, account, or server**.

First download, in Konsole:

```sh
mkdir -p ~/Downloads
cd ~/Downloads
git clone https://github.com/ShaelRiley/v32-music-visualizer.git
cd v32-music-visualizer
realpath dist/extension
```

The last line prints the exact folder to select in Chrome. On a Steam Deck with the standard `deck` account, it is `/home/deck/Downloads/v32-music-visualizer/dist/extension`.

1. Open **Chrome** and enter `chrome://extensions` in its address bar.
2. Turn on **Developer mode** at the upper right.
3. Choose **Load unpacked** and select the printed `dist/extension` folder. Select the folder containing `manifest.json`, rather than the repository root or a ZIP file.
4. Open Chrome's **Extensions** menu (the puzzle-piece button) and pin **Video32 Music Visualizer** for convenient access.
5. Start music in a browser tab, then click the Video32 icon **while that music tab is selected**. A separate visualizer tab opens and the source music should remain audible.
6. Choose **Controls** to select the audio source, presets, Discovery, palettes, or quality. **Stop** releases capture. Closing the visualizer tab also ends capture.

Keep the checkout in that folder: Chrome loads it in place. Local-file playback is available under **Controls → Local file**. **Demo** shows the renderer using clearly labeled simulated musical features; it does not play a song or capture audio.

For later updates, in Konsole:

```sh
git -C ~/Downloads/v32-music-visualizer pull --ff-only
```

After pulling, stop capture, open `chrome://extensions`, click the **Reload** button on Video32's card, close any old visualizer tab, and start it again from the music tab. The repository tracks the unpacked build, so updates need no rebuild.

## Install from a ZIP instead

1. Extract **Video32-Chrome-Extension.zip** into a permanent folder.
2. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select that folder. Its root contains `manifest.json`.
3. Play music in a browser tab. Click Video32’s extension action **in that music tab**. The visualizer opens separately; the original music stays audible through one stereo route.
4. Use **Controls** to choose palettes, depth, library or Discovery, density, mark size, camera, or quality. **Stop** releases capture. Closing the visualizer also ends capture.

Chrome 116+ and WebGL2 are required. No installation of npm packages is needed to use the extension. No account, server, microphone permission, or internet connection is required during playback. Protected content and browser-controlled pages can reject capture; the error is shown, with local audio-file and labeled Demo routes available.

This **0.2.0 revision** starts from published commit `2a01390ee0cca552951c5fa62b7d73bbd7fc2115`. The user installed the baseline, confirmed that it works, and liked it. The revision strengthens sustained musical response, closer framing and fluid deformation; beats rotate marks instead of driving brightness. Detailed physical stereo routing, capture cleanup, native fullscreen and sustained Steam Deck performance have not been independently qualified. The 60 FPS target remains a target. Exact test scope is in [VERIFICATION.md](docs/VERIFICATION.md).

If the extension does not appear, confirm that the selected directory is `dist/extension` and contains `manifest.json`. If capture is rejected, try an ordinary music tab, select **Local file**, or use **Demo** to check rendering. If the page reports that WebGL2 is unavailable, check Chrome's graphics acceleration setting and restart Chrome after changing it. For low frame rates, choose **Controls → Camera & quality → Economy**, reduce sampling density, or keep **Adaptive** quality enabled. Protected media and browser-internal pages cannot always be captured; the app reports the error.

For a local file, use **Controls → Local file**. The file never leaves the browser. **Share audio** opens the browser’s chooser and requires an actual audio track; screen/system audio depends on browser and OS. It never substitutes the microphone. Shared browser-tab audio is rerouted; screen/window audio is analyzed without replaying system sound.

## Controls

| Control | Result |
| --- | --- |
| Hold / H | Keep the current world; animation and audio response continue. |
| Pause / Space | Freeze imagery; music continues. |
| Next / Right arrow | Advance, or return forward through recent history. |
| Previous / Left arrow | Recover an earlier world from bounded history. |
| Star / S | Favorite an authored scene, or save a Discovery’s constructed world. |
| Fullscreen / F | Enter or leave fullscreen. All controls, captions, messages and the cursor fade after 2.3 seconds of inactivity; pointer or keyboard interaction reveals them. |
| Hide / Tab | Hide the interface completely; Tab restores it. |
| Drag the stage | Change camera azimuth and elevation. |
| Mouse wheel | Change camera distance. |

Mark size, sampling density, world scale, and camera distance are separate controls. Density adds/removes persistent low-discrepancy samples; changing spacing is its natural consequence. Saved worlds include normalized layers, generator and schema versions, initial clock, audio mappings and viewing settings. They recover the construction, not a recorded performance. JSON exports contain no audio. Imports accept only the bundled bounded vocabulary and schema.

The default show alternates regular **authored** creations with spatial creations, shuffling Polygon and Video through the spatial slots, with a randomized first regular scene, complete shuffled traversal inside each bank and 45-second scenes. Discovery is excluded from the default show. Choose Regular library, Polygon spaces or VR video studies to stay in one bank. **Cycle palettes** is on by default and chooses a shuffled palette for each automatic scene; turn it off to keep the current palette. Manual selection and history do not change the palette automatically.

The optional Mixed show retains the elapsed-time target of 50% regular authored scenes and 50% Discovery. Hold, Pause, hidden time and manual scenes have the established accounting exclusions. A musical boundary can extend a scene by up to one second. Scene handoffs use a small geometric settling movement; music never modulates mark brightness or presence.

## Three representations

| Bank | What it reconstructs |
| --- | --- |
| Regular · 256 | Form-extended pointillism: closer membranes, strands, waves, tunnels, arches, cells and orbital structures, with continuous bending throughout the forms. |
| Polygon spaces · 256 | Eight tours each through 32 source spaces: mapped city/building footprints including the Louvre precinct, actual Freedoom levels, CC0 house neighborhoods and measured US terrain. |
| VR video studies · 256 | Nine-frame studies from 256 distinct licensed **360°** source videos, viewed through a 180° hemisphere and recreated with patch-matched Video32 forms. All 32 masks appear across the bank. |

Video studies are slow forward/reverse image loops with viewing sweeps and musical deformation, rather than full-length native VR180 movies or a depth reconstruction. Native VR180 media located during research was gated; it was not bundled. Source colours are retained as RGB565 before palette treatment. Camera dragging changes viewing direction and the distance control changes field of view in this bank.

Floor/wall/roof classes and terrain height/slope determine spatial colour placement. Regular layers have authored colour roles and resting-coordinate bands. Video colour follows the recorded image. These patterns stay attached to their forms as music bends them. Sources, licences, precise interpretations and regeneration instructions are in [SPATIAL-SOURCES.md](docs/SPATIAL-SOURCES.md) and the viewer's linked source page.

## Color and glyph fidelity

Exactly indices 0–31 of Video64’s production default are present, in order, including Void. The original 8×16 bitmap geometry and aspect are unchanged. There is no font substitution, glyph expansion, or 64-glyph mode.

The revision picker has 37 applicable treatments: 20 new themes, five distinctive original color paths and 12 retained original treatments. Redundant entries are removed from the picker; all 55 original entries remain inventoried in the retained upstream tables for provenance and parity checks. Native Glyph is explicitly unavailable for these monochrome masks. ANSI Tube’s grading, finite-depth discipline and True Color bypass are retained. The original MooBurst artwork remains as a color path; its unrelated cameo and audio are omitted. Depth choices are 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 256 and True Color. Black is disclosed as an extra stage color when absent from the selected palette.

Opaque binary glyph masks, depth testing, disabled dithering and antialiasing, and nearest-neighbor output preserve finite artwork colors. Source brightness/saturation grading and palette treatments precede finite quantization. New finite palette selection samples distinctive artwork colors and uses exact lookup quantization. True Color bypasses the finite lookup and retains 8-bit RGB output. Interface colors are separate. No glow, trail, transparency or smooth compositing silently widens a finite artwork palette. Details and exceptions are in `docs/NOTICES.md` and `assets/provenance.json`.

## Source, build and verification

The source archive includes this project, all presets, licensed source snapshots/metadata, renderer previews, the repertoire atlas and raw verification reports. Code is MIT; source-derived data and previews retain their separate licences as described in the notices. The shipped extension is dependency-free. Node 20.11+ is needed only to rebuild or test. `npm run build` copies the self-contained extension to `dist/extension`. `npm run package` creates both ZIP archives in the adjacent `deliverables` directory using Node’s built-in libraries.

```sh
npm test
npm run build
npm run dev
```

Open `http://localhost:4173/visualizer.html` for the same renderer with Demo and local-file inputs. Extension tab capture requires loading the extension. `previews/index.html` is a static browseable atlas with IDs, descriptions and sampled animations, and can be opened directly. Contact sheets are under `previews/contact-sheets/`. Individual spatial thumbnails are reproducible intermediates; the atlas uses compact animated contact sheets.

Browser verification needs Playwright, Sharp and a compatible Chromium executable. Use `npm ci`, `npx playwright install chromium`, then `npm run verify:browser`. An existing browser can be supplied through `V32_BROWSER`. Tests create a local server inside their process. Run `npm run verify:display` for screenshot color checks, `npm run verify:revision` for sustained response/fullscreen behavior, `npm run verify:spatial` for all 512 new creations, `node tools/performance.mjs` for timing/resource diagnostics, and `npm run gallery` to rebuild the static repertoire atlas. The development-only `?dev=1` URL exposes the renderer test adapter; it supports a comparison replacing all marks with canonical Full Block (index 7) while keeping the world, camera, time and features fixed. `previews/form-composed.png` and `previews/form-fixed-block.png` show that comparison.

After packaging, `python3 tools/zip-qa.py --record` independently checks every ZIP entry and CRC against the unpacked build and records its hash. The repository packaging workflow rebuilds the archive from the committed, verified runtime and requires that recorded hash before committing the ZIP. This handles archives larger than the connected GitHub tool’s upload limit; installation still needs no build job or account.

The MP4 preview samples twelve seconds at eight frames per second using explicitly simulated musical features. It is a visual preview, not an FPS measurement. MP4 and animated WebP compression can introduce extra colors, including in sheets assembled from WebP previews; palette fidelity is established by original lossless artwork pixels and final-display screenshot tests. Raw motion frames are reproducible with the browser harness and omitted from the source ZIP to avoid redundant bulk. To encode the preview after that harness, run:

```sh
ffmpeg -framerate 8 -i previews/motion-frames/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart previews/Video32-Preview.mp4
```

Upstream refresh is optional and never required to build. Check out the two recorded commits in sibling `upstream/v64` and `upstream/ansi-tube` directories before running `python3 tools/import-upstream.py`; the importer rejects other commit IDs and does not write to either checkout.

Test scope, environments, actual measurements and remaining device checks are in `docs/VERIFICATION.md`. The progress ledger is `docs/PROGRESS.md`. The extension has not been published to the Chrome Web Store, and neither upstream project was modified.
