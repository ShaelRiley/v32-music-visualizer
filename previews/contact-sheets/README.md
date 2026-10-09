Twelve PNG contact sheets cover all 768 presets with their stable IDs: four regular, four polygon and four video sheets. Eight animated spatial sheets sample three development stages. The static atlas is one folder up, at `previews/index.html`.

Images come from the actual renderer with simulated musical features. Source-derived polygon and video previews retain their data licences; credits and interpretation limits are in `docs/SPATIAL-SOURCES.md` and `space-credits.html`. Video studies use nine source frames from 360° footage viewed through 180°.

`npm run verify:spatial` regenerates individual spatial thumbnails in the ignored `previews/spatial-frames` folder. `npm run gallery` combines them into these compact sheets. The individual spatial thumbnails are reproducible intermediates and are excluded from the source archive.

Sheets combine the decoded sampled WebP previews. WebP compression can introduce colors, so these sheets illustrate compositions and are not finite-palette proofs. Palette checks use original lossless artwork and browser screenshots.
