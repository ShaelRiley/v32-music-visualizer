import {VR_DATA} from '../../assets/vr/manifest.mjs';
import {SPACE_DATA} from '../../assets/spaces/manifest.mjs';
const rows=SPACE_DATA.sources.map(source=>{const row=document.createElement('tr'),name=document.createElement('td'),credit=document.createElement('td'),adaptation=document.createElement('td'),link=document.createElement('a');link.href=source.url;link.textContent=source.name;name.append(link);credit.textContent=source.credit+' · '+source.license;adaptation.textContent=source.adaptation;row.append(name,credit,adaptation);return row;});
document.getElementById('sources').append(...rows);

const videos=VR_DATA.views.map(v=>{const row=document.createElement('tr');for(const [text,url]of [[v.name,v.sourceURL],[v.author,v.authorURL],[v.originalLicense,null],[v.projection,null]]){const cell=document.createElement('td');if(url){const a=document.createElement('a');a.href=url;a.textContent=text;cell.append(a);}else cell.textContent=text;row.append(cell);}return row;});document.getElementById('videoSources').append(...videos);
