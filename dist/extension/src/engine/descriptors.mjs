// Structural descriptors ported from ANSI Tube; only canonical 32 masks.
import glyphs from "./glyph-data.mjs";
const CELL_WIDTH=8, CELL_HEIGHT=16;
  function orientationHistogram(values, histogram = new Float32Array(4)) {
    histogram.fill(0);
    let total = 0;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const left = values[y * 4 + Math.max(0, x - 1)];
        const right = values[y * 4 + Math.min(3, x + 1)];
        const top = values[Math.max(0, y - 1) * 4 + x];
        const bottom = values[Math.min(7, y + 1) * 4 + x];
        const gx = right - left;
        const gy = bottom - top;
        const magnitude = Math.hypot(gx, gy);
        if (magnitude < 0.01) continue;
        let angle = Math.atan2(gy, gx);
        if (angle < 0) angle += Math.PI;
        if (angle >= Math.PI) angle -= Math.PI;
        histogram[Math.round(angle / (Math.PI / 4)) & 3] += magnitude;
        total += magnitude;
      }
    }
    if (total > 0) for (let index = 0; index < 4; index += 1) histogram[index] /= total;
    return histogram;
  }

  function buildVideoGlyphFeature(mask) {
    const coverage = new Float32Array(32);
    const occupancy = new Float32Array(8);
    let binaryMask = 0;
    let filled = 0;
    let weightedX = 0;
    let weightedY = 0;
    for (let y = 0; y < CELL_HEIGHT; y += 1) {
      const row = mask[y];
      for (let x = 0; x < CELL_WIDTH; x += 1) {
        if (!(row & (0x80 >> x))) continue;
        filled += 1;
        weightedX += x;
        weightedY += y;
      }
    }
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        let count = 0;
        for (let oy = 0; oy < 2; oy += 1) {
          const row = mask[y * 2 + oy];
          for (let ox = 0; ox < 2; ox += 1) count += Boolean(row & (0x80 >> (x * 2 + ox)));
        }
        const index = y * 4 + x;
        coverage[index] = count / 4;
        if (count > 0) binaryMask = (binaryMask | (1 << index)) >>> 0;
        occupancy[(y >> 1) * 2 + (x >> 1)] += coverage[index] * 0.25;
      }
    }
    return {
      coverage,
      binaryMask,
      area: filled / (CELL_WIDTH * CELL_HEIGHT),
      centroidX: filled ? weightedX / filled / (CELL_WIDTH - 1) : 0.5,
      centroidY: filled ? weightedY / filled / (CELL_HEIGHT - 1) : 0.5,
      occupancy,
      orientation: orientationHistogram(coverage)
    };
  }

export const DESCRIPTORS=glyphs.masks.map(buildVideoGlyphFeature);
export { orientationHistogram, buildVideoGlyphFeature };
