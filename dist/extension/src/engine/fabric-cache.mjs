// Local immutable bundles reduce file overhead; decoded scene caches stay separate.
export class FabricCache {
 constructor(bank,limit=2){this.bank=bank;this.limit=limit;this.entries=new Map();}
 read(view){
  const key=view.file;
  if(!this.entries.has(key)){
   const promise=fetch(new URL('../../assets/'+this.bank+'/data/'+key,import.meta.url)).then(r=>{if(!r.ok)throw Error('Bundled fabric could not load');return r.arrayBuffer();}).catch(error=>{if(this.entries.get(key)===promise)this.entries.delete(key);throw error;});
   if(this.entries.size>=this.limit)this.entries.delete(this.entries.keys().next().value);this.entries.set(key,promise);
  }
  const promise=this.entries.get(key);this.entries.delete(key);this.entries.set(key,promise);
  return promise.then(bytes=>{if(view.offset+view.bytes>bytes.byteLength)throw Error('Invalid bundled fabric range');return bytes.slice(view.offset,view.offset+view.bytes);});
 }
}
