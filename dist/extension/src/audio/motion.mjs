import {clamp} from '../engine/random.mjs';

// Broad, sustained energy reaches every layer. A layer's named band remains
// its accent rather than its only permission to move.
export function musicalActivity(audio = {}) {
  const bands = ['bass', 'mid', 'treble'].map(k => clamp(audio[k] || 0));
  return clamp(Math.max(audio.level || 0, ...bands) * .6 +
    (bands[0] + bands[1] + bands[2]) * .1 + (audio.trend || 0) * .1);
}

export function musicalDrive(audio, band) {
  return clamp((audio?.[band] || 0) * .6 + musicalActivity(audio) * .4);
}
