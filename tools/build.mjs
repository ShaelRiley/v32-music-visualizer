import {mkdir,cp,readFile,rm,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),target=resolve(root,'dist/extension');await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
for(const name of ['src','assets','manifest.json','visualizer.html','offscreen.html','LICENSE','README.md'])await cp(resolve(root,name),resolve(target,name),{recursive:true});
await cp(resolve(root,'docs/NOTICES.md'),resolve(target,'NOTICES.md'));
await mkdir(resolve(target,'docs'),{recursive:true});
for(const name of ['NOTICES.md','ARCHITECTURE.md','VERIFICATION.md','PROGRESS.md'])await cp(resolve(root,'docs',name),resolve(target,'docs',name));
console.log('Unpacked extension: '+target);
