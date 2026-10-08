export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export function hash(text) { let n=2166136261; for(const c of String(text)) n=Math.imul(n^c.charCodeAt(0),16777619); return n>>>0; }
export function rng(seed) { let a=typeof seed==='number'?seed>>>0:hash(seed); return ()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;}; }
export function shuffle(list,random=Math.random) { const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
export function freshSeed() { const a=new Uint32Array(2);crypto.getRandomValues(a);return [...a].map(n=>n.toString(16).padStart(8,'0')).join(''); }
export const pick=(r,a)=>a[Math.floor(r()*a.length)];
