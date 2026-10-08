import {mkdir,writeFile} from 'node:fs/promises';
export async function makeFixture(){const rate=48000,duration=8,n=rate*duration,pcm=Buffer.alloc(n*4),wav=Buffer.alloc(44+n*4);for(let i=0;i<n;i++){
 const t=i/rate,hit=Math.exp(-(t%.5)*40),quiet=t>5&&t<6?.025:t>6&&t<7?0:1;
 const bass=Math.sin(t*Math.PI*2*80)*.20*hit,mid=Math.sin(t*Math.PI*2*440)*.1,treble=Math.sin(t*Math.PI*2*3800)*.018;
 pcm.writeInt16LE(Math.round((bass+mid+treble)*quiet*32760),i*4);pcm.writeInt16LE(Math.round((bass*.6+mid*(.6+.35*Math.sin(t))+treble)*quiet*32760),i*4+2);
 }wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length,40);pcm.copy(wav,44);await mkdir('tests/fixtures',{recursive:true});await writeFile('tests/fixtures/generated-stereo.wav',wav);return 'tests/fixtures/generated-stereo.wav';}
if(process.argv[1]===import.meta.filename)console.log(await makeFixture());
