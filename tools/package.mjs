import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {deflateRawSync} from 'node:zlib';
import './build.mjs';

const root=resolve(import.meta.dirname,'..'),out=resolve(root,'../deliverables');
await mkdir(out,{recursive:true});
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
async function files(directory,skip=new Set()){
 const result=[];
 for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const path=resolve(directory,entry.name);if(skip.has(entry.name)||skip.has(relative(root,path)))continue;
  if(entry.isDirectory())result.push(...await files(path,skip));else if(entry.isFile())result.push(path);
 }
 return result;
}
async function archive(name,base,paths,prefix=''){
 const chunks=[],central=[];let offset=0;
 // Reproducible ZIP timestamps. Inputs remain normal source files.
 const date=((2026-1980)<<9)|(10<<5)|8;
 for(const path of paths){
  const filename=Buffer.from(prefix+relative(base,path).replaceAll('\\','/'));
  const data=await readFile(path),packed=deflateRawSync(data,{level:9}),crc=crc32(data);
  const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(date,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(packed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
  chunks.push(header,filename,packed);
  const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(8,10);entry.writeUInt16LE(date,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(packed.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(filename.length,28);entry.writeUInt32LE(offset,42);
  central.push(entry,filename);offset+=header.length+filename.length+packed.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(paths.length,8);end.writeUInt16LE(paths.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 const bytes=Buffer.concat([...chunks,directory,end]),destination=resolve(out,name);await writeFile(destination,bytes);
 console.log(JSON.stringify({file:destination,files:paths.length,bytes:bytes.length}));
}
await archive('Video32-Chrome-Extension.zip',resolve(root,'dist/extension'),await files(resolve(root,'dist/extension')));
await archive('Video32-Source-and-Verification.zip',root,await files(root,new Set(['node_modules','dist','.git','previews/motion-frames'])),'v32-music-visualizer/');
