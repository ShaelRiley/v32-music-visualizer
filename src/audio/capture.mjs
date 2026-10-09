// Chromium's stream-ID API uses legacy constraints. Do not mix the modern
// dictionary with mandatory/optional in the same getUserMedia request.
export const MUSIC_CONSTRAINTS=Object.freeze({echoCancellation:false,noiseSuppression:false,autoGainControl:false});
export function tabAudioConstraints(streamId){return {
 mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:streamId},
 optional:[{echoCancellation:false},{googEchoCancellation:false},{googAutoGainControl:false},{googNoiseSuppression:false},{googHighpassFilter:false}]
};}
export async function prepareMusicStream(stream){
 const tracks=stream.getAudioTracks();if(!tracks.length)throw Error('The source supplied no audio track');
 for(const track of tracks){
  // Generated/native streams need not implement reconfiguration. Apply only
  // capabilities this particular track advertises; never force a mono source.
  const caps=track.getCapabilities?.()||{},before=track.getSettings?.()||{},constraints={};
  for(const key of Object.keys(MUSIC_CONSTRAINTS))if(key in caps&&before[key]!==false&&!caps[key].every(value=>value===false))constraints[key]=false;
  if(track.applyConstraints&&Object.keys(constraints).length)await track.applyConstraints(constraints);
  const settings=track.getSettings?.()||{};
  if(Object.keys(MUSIC_CONSTRAINTS).some(key=>settings[key]!==undefined&&settings[key]!==false))throw Error('The browser kept speech processing enabled. Capture stopped to preserve the source audio.');
 }
 return tracks[0].getSettings?.()||{};
}
