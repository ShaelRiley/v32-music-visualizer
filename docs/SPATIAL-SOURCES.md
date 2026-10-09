# Spatial sources and interpretations

The polygon bank contains **32 source spaces with eight guided tours each**, for 256 presets. The spherical-video bank contains **256 distinct original source videos**, with one nine-frame study per video. These counts refer to different units; neither bank is presented as 256 independently surveyed buildings or full-length movies.

| Source | Material | Licence | Interpretation |
| --- | --- | --- | --- |
| OpenStreetMap | Selected building, building-part and road ways in eight districts | ODbL 1.0 | Footprints extruded using mapped heights or disclosed 12 m / 3 m-per-level estimates; heights exaggerated 2.5×. Guided roads and facade targets. |
| Freedoom | Phase 2 maps 01–12, pinned commit `3ac019628d70b812ffb722f7f2365771b76a9d29` | BSD-3-Clause | Actual linedefs, sector floors/ceilings and portal openings. Static guided rails; no actors, commercial Doom data, textures, sounds or game mechanics. |
| Kenney City Kit (Suburban) 2.0 | Sixteen house meshes | CC0 | Eight fixed authored neighborhoods assembled from the meshes. |
| USGS via Mapzen / Tilezen | Terrarium elevation tiles for Grand Canyon, Yosemite, Mount Rainier and Death Valley | Public domain | Actual decoded 65×65 height fields, normalized with 1.7× vertical exaggeration. |
| FAU-LMS UGC360 | Nine-frame sequences from 256 distinct Vimeo/YouTube videos | Dataset and adaptations CC BY-SA 4.0; original families CC BY / CC BY-SA / CC0 | Full 360° sphere, patch-matched canonical glyphs, RGB565 source colors, slow forward/reverse loops, complete camera turns and musical bending. |

Mapped districts: Louvre precinct, Venice San Marco, Prague Old Town, Rome Pantheon, Barcelona Gothic Quarter, Kyoto Gion, London Westminster and Manhattan Financial District. The Louvre entry reconstructs mapped exterior masses and roads. It does not claim scanned interiors, facade detail or a museum walkthrough.

Polygon source snapshots are retained in `vendor/spaces`; point fabrics and full per-source credit, hashes, adaptations and rails are in `assets/spaces`. OSM subsets are compressed XML, with original and filtered hashes recorded. ODbL source subsets and derived fabrics remain offered under ODbL; the other data retains its own licences. The runtime's linked source page includes the required attribution while fullscreen immersion can remain free of overlays.

The video bank preserves **full 360° spherical footage**. Every source longitude is represented; dragging or automatic camera turns can reveal the entire panorama. Research located the [Linxuan Lu VR180 dataset](https://huggingface.co/datasets/lulinxuan/VR180), but media access was gated and no such media was downloaded. Native camera VR180 has its own projection/calibration and stereo metadata; this bank reconstructs a monoscopic sphere.

[UGC360](https://huggingface.co/datasets/FAU-LMS/UGC360) provides consecutive nine-frame sequences and a per-clip source licence column. Some entries are NC or ND; those were excluded. The selected 256 studies use only the recorded `cc-by`, `cc-by-sa` and `cc-cc0` families. The source CSV records licence families, not every original licence version. Available original creator/title metadata is retained; where a platform no longer returns that information, the source link and all information supplied by the dataset are credited. This is a documented selection from the dataset, not an independent copyright audit of every current platform page.

A video study reconstructs **image structure on a curved surface**. It has no measured depth, stereo disparity, collision geometry or six-degree-of-freedom reconstruction. Source frame cadence is not supplied by the dataset CSV. The nine frames therefore run as an artistic slow forward/reverse loop, without a claim of original real-time playback. Full camera turns and continuous geometry deformation supply motion between source frames. All 32 unchanged masks were selected by the image matcher across the bank; glyph IDs are categorical and are never numerically interpolated.

Sources and derivations are bundled locally. Playback fetches only extension files. Rebuilding the supplied extension needs no source-download operation. To regenerate source-derived data during development:

```sh
# Python 3, NumPy, Pillow and Shapely are development dependencies only.
python3 tools/import-spaces.py
# Fetches only the selected public archive byte ranges; no account is needed.
python3 tools/fetch-vr.py /path/to/video32-source-frames
python3 tools/import-vr.py /path/to/video32-source-frames
python3 tools/bundle-fabrics.py
```

`vendor/vr/acquisition.json` pins dataset revision `99f74d256df961695968f6f39d58e1b004ce0a59`, byte offsets, original source-frame SHA-256 values and archive CRCs. Downloads reject mismatches. Derived glyph images have their own manifest hashes. The full CC BY-SA licence and dataset attribution are bundled under `assets/vr/licenses`; the MIT renderer licence remains separate.

Primary references: [OpenStreetMap copyright](https://www.openstreetmap.org/copyright), [OSMF attribution guidance](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines), [Kenney kit](https://kenney.nl/assets/city-kit-suburban), [Freedoom](https://freedoom.github.io/), [Tilezen terrain attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md), [USGS 3DEP](https://www.usgs.gov/3d-elevation-program), [UGC360](https://huggingface.co/datasets/FAU-LMS/UGC360), and [Google's VR180 specification](https://github.com/google/spatial-media/blob/master/docs/vr180.md).
