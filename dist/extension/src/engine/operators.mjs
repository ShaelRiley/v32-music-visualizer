import {musicalActivity, musicalDrive} from '../audio/motion.mjs';
export const OPERATORS = Object.freeze([
  'ribbon','torus','shell','helix','wave','gyroid','knot','branch','cell','spiral','cone','saddle','catenoid','mobius','klein','superquadric',
  'rosette','lattice','vortex','strata','iris','coral','lens','hourglass','tesseract','crystal','scroll','wavefront','braid','arch','reaction','weft'
]);
export const EFFECTS=Object.freeze(['still','fold','twist','ripple','split','grow','circulate','invert','collapse']);
export const RELATIONS=Object.freeze(['independent','blend','wrap','repel','intersect','weave']);
export const CAMERAS=Object.freeze(['orbit','passage','interior','hold','rise','detail']);
const T=Math.PI*2;
const signedPow=(x,p)=>Math.sign(x)*Math.abs(x)**p;
// Parameter domains are bounded. These surfaces are sampled as marks, never rasterized as meshes.
export function sampleShape(op,u,v,t=0,out=new Float64Array(3)) {
  const b=v*T,w=v*2-1,h=u*2-1;let a=u*T,x=0,y=0,z=0,r=0,q=0,k=0;
  switch(op) {
    case 'ribbon': r=1.05+0.38*w*Math.cos(1.5*a);x=r*Math.cos(a);y=.62*w+.18*Math.sin(3*a);z=r*Math.sin(a)+.24*w*Math.sin(1.5*a);break;
    case 'torus': r=1+.37*Math.cos(b);x=r*Math.cos(a);y=.37*Math.sin(b);z=r*Math.sin(a);break;
    case 'shell': r=1+.12*Math.sin(5*a)*Math.sin(3*b);x=r*Math.cos(a)*Math.sin(Math.PI*v);y=r*Math.cos(Math.PI*v);z=r*Math.sin(a)*Math.sin(Math.PI*v);break;
    case 'helix': a*=3;r=.64+.12*Math.cos(b);x=r*Math.cos(a);y=2*h+.13*Math.sin(b);z=r*Math.sin(a);break;
    case 'wave':x=2*h;z=1.6*w;y=.3*Math.sin(4*x+2*z+t)+.2*Math.cos(3*z-1.4*t);break;
    case 'gyroid':x=1.6*h;z=1.6*w;y=.5*(Math.sin(x*3)*Math.cos(z*3)+Math.sin(z*3)*Math.cos(x*3))+ .18*Math.sin(6*x+6*z);break;
    case 'knot':q=2*a;r=.85+.3*Math.cos(3*a);x=r*Math.cos(q)+.11*Math.cos(b)*Math.cos(q);y=.38*Math.sin(3*a)+.11*Math.sin(b);z=r*Math.sin(q)+.11*Math.cos(b)*Math.sin(q);break;
    case 'branch':k=Math.floor(u*12);q=(u*12-k);r=.2+.8*q;x=(k%3-1)*r*.72+.1*Math.cos(b);y=q*1.6-.85+(Math.floor(k/3)%2)*.4;z=(Math.floor(k/3)-1.5)*r*.38+.1*Math.sin(b);break;
    case 'cell':k=Math.floor(u*7);a=(u*7-k)*T;r=.38;x=r*Math.cos(a)*Math.sin(Math.PI*v)+.72*Math.cos(k*2.4);y=r*Math.cos(Math.PI*v)+.4*Math.sin(k*1.7);z=r*Math.sin(a)*Math.sin(Math.PI*v)+.72*Math.sin(k*2.4);break;
    case 'spiral':a*=3;r=.16+u*1.3;x=(r+.09*Math.cos(b))*Math.cos(a);y=.7*h+.09*Math.sin(b);z=(r+.09*Math.cos(b))*Math.sin(a);break;
    case 'cone':r=.2+v;x=r*Math.cos(a);y=1.8*(v-.5);z=r*Math.sin(a);break;
    case 'saddle':x=1.2*h;z=1.2*w;y=.55*(x*x-z*z);break;
    case 'catenoid':r=.46*Math.cosh(1.5*w);x=r*Math.cos(a);y=w;z=r*Math.sin(a);break;
    case 'mobius':r=1+.42*w*Math.cos(a*.5);x=r*Math.cos(a);y=.42*w*Math.sin(a*.5);z=r*Math.sin(a);break;
    case 'klein':r=.62+.22*Math.cos(b);x=(r*Math.cos(a)+.36*Math.sin(a)*Math.cos(a));y=.7*Math.sin(a)+.22*Math.sin(b);z=r*Math.sin(a)*Math.cos(a*.5)+.3*Math.cos(b)*Math.sin(a*.5);break;
    case 'superquadric':x=signedPow(Math.sin(Math.PI*v),.45)*signedPow(Math.cos(a),.45);y=signedPow(Math.cos(Math.PI*v),.45);z=signedPow(Math.sin(Math.PI*v),.45)*signedPow(Math.sin(a),.45);break;
    case 'rosette':r=.3+v*(.65+.25*Math.cos(6*a));x=r*Math.cos(a);y=.3*Math.sin(6*a)*v+.25*v*v;z=r*Math.sin(a);break;
    case 'lattice':k=Math.floor(u*18);q=u*18-k;x=(k%3-1)*.65;y=(Math.floor(k/3)%3-1)*.65;z=(q*2-1)*1.2;if(k>8){z=y;y=(q*2-1)*1.2;}x+=.045*Math.cos(b);y+=.045*Math.sin(b);break;
    case 'vortex':r=.2+v*1.25;a+=v*5;x=r*Math.cos(a);y=1.2*(.5-v)+.18*Math.sin(a*3);z=r*Math.sin(a);break;
    case 'strata':k=Math.floor(v*6);q=v*6-k;x=1.5*h;z=2*q-1;y=(k-2.5)*.3+.13*Math.sin(x*3+q*5+k);break;
    case 'iris':r=.45+v*.7;x=r*Math.cos(a);y=.24*Math.sin(a*9+v*5);z=r*Math.sin(a);break;
    case 'coral':k=Math.floor(u*9);q=u*9-k;r=.15+.75*q;a=k*2.4+q*1.4;x=r*Math.cos(a)+.09*Math.cos(b);y=1.3*q-.7+.12*Math.sin(b);z=r*Math.sin(a);break;
    case 'lens':r=Math.sin(Math.PI*v);x=r*Math.cos(a);y=.25*Math.cos(Math.PI*v);z=r*Math.sin(a);break;
    case 'hourglass':r=.16+.95*Math.abs(w)**1.3;x=r*Math.cos(a);y=w;z=r*Math.sin(a);break;
    case 'tesseract':k=Math.floor(u*24);q=u*24-k;r=k<12?.72:1.2;k%=12;x=(k%4<2?-1:1)*r;y=(k%2?-1:1)*r;z=(2*q-1)*r;if(k>=4&&k<8){z=y;y=(2*q-1)*r;}if(k>=8){z=x;x=(2*q-1)*r;}x+=.035*Math.cos(b);y+=.035*Math.sin(b);break;
    case 'crystal':r=.85*(1-.38*Math.abs(w));q=Math.floor(u*6);a=q*T/6+(u*6-q)*T/6;x=r*Math.cos(a);y=w;z=r*Math.sin(a);break;
    case 'scroll':a*=2;r=.15+u*.9;x=r*Math.cos(a);y=1.6*w;z=r*Math.sin(a)+.2*Math.sin(w*4);break;
    case 'wavefront':r=.15+v*1.2;x=r*Math.cos(a);y=.28*Math.sin(v*16-t*2);z=r*Math.sin(a);break;
    case 'braid':k=Math.floor(v*3);q=v*3-k;a=u*T*2+k*T/3;x=.45*Math.cos(a)+.08*Math.cos(q*T);y=2*h;z=.45*Math.sin(a)+.08*Math.sin(q*T);break;
    case 'arch':a=u*Math.PI;r=1+.25*Math.cos(b);x=r*Math.cos(a);y=r*Math.sin(a)-.5;z=.25*Math.sin(b);break;
    case 'reaction':x=1.3*h;z=1.3*w;y=.38*Math.sin(7*x)*Math.sin(7*z)+.16*Math.cos(3*x+4*z);break;
    case 'weft':k=Math.floor(v*12);q=v*12-k;x=1.4*h;z=(k-5.5)*.22;y=.14*Math.sin(x*8+k*Math.PI)+.03*Math.sin(q*T);break;
    default:throw new RangeError('Unknown spatial operator');
  }
  out[0]=x;out[1]=y;out[2]=z;return out;
}
export function sampleLayer(layer,u,v,t,audio={bass:0,mid:0,treble:0,onset:0,trend:0},out=new Float64Array(3)) {
  sampleShape(layer.op,u,v,t,out);
  const activity=musicalActivity(audio),signal=musicalDrive(audio,layer.audio),phase=t*.38+layer.phase;
  let x=out[0],y=out[1],z=out[2];
  if(layer.relation!=='independent') {
    const p=sampleShape(layer.partner,u,v,t);
    if(layer.relation==='blend'){const m=.25+.25*Math.sin(phase);x=x*(1-m)+p[0]*m;y=y*(1-m)+p[1]*m;z=z*(1-m)+p[2]*m;}
    if(layer.relation==='wrap'){x+=.3*p[0];y+=.3*p[1];z+=.3*p[2];}
    if(layer.relation==='repel'){const q=.16/(.3+Math.hypot(x-p[0],y-p[1],z-p[2]));x+=(x-p[0])*q;y+=(y-p[1])*q;z+=(z-p[2])*q;}
    if(layer.relation==='weave'){const q=.22*Math.sin(u*31+v*17+phase);x+=q*p[0];y+=q*p[1];z+=q*p[2];}
    // Intersection is a spatial aperture in the fragment/visibility predicate, not a composite raster.
  }
  switch(layer.effect){
    case 'fold':y+=.34*(.45+signal*1.1)*Math.sin(x*2+phase);break;
    case 'twist':{const q=y*(.35+signal*1.1)+phase*.24;const c=Math.cos(q),s=Math.sin(q);[x,z]=[c*x-s*z,s*x+c*z];break;}
    case 'ripple':y+=.22*(.2+signal*1.4)*Math.sin(6*Math.hypot(x,z)-t*2.2+layer.phase);break;
    case 'split':x+=Math.tanh(x*2)*(.12+.35*(.5+.5*Math.sin(phase)))*signal;break;
    case 'grow':{const q=.92+.08*Math.sin(phase+y*.75)+.12*signal;x*=q;y*=q;z*=q;break;}
    case 'circulate':{const a=phase*.55+.35*signal+.14*activity*Math.sin(y*1.8-phase),c=Math.cos(a),s=Math.sin(a);[x,z]=[c*x-s*z,s*x+c*z];break;}
    case 'invert':y*=.82+.18*Math.cos(phase*.5+signal*.8);break;
    case 'collapse':{const q=.9+.1*Math.cos(phase*.7);x*=q;z*=q;y+=.3*Math.sin(phase+y*4)*signal;break;}
  }
  // Broad traveling bends vary along all three axes, so even a long strand
  // flexes along its length. Finer ripples ride the bend instead of translating
  // an entire segment. The field is continuous in space and time.
  const px=x,py=y,pz=z;
  y+=(.025+.24*activity+.12*signal)*Math.sin(px*2.2+pz*1.7-t*1.35+layer.phase);
  y+=.055*signal*Math.sin(px*5.1-pz*3.4-t*2.1+layer.phase);
  x+=(.02+.20*activity+.06*signal)*Math.sin(py*1.8+pz*1.1-t*.95+layer.phase);
  z+=(.02+.13*activity+.10*signal)*Math.sin(py*1.6-px*1.4-t*.8+layer.phase*.7);
  const rot=layer.rotate;let c=Math.cos(rot[0]),s=Math.sin(rot[0]);[y,z]=[c*y-s*z,s*y+c*z];c=Math.cos(rot[1]);s=Math.sin(rot[1]);[x,z]=[c*x-s*z,s*x+c*z];c=Math.cos(rot[2]);s=Math.sin(rot[2]);[x,y]=[c*x-s*y,s*x+c*y];
  out[0]=x*layer.scale[0]+layer.offset[0];out[1]=y*layer.scale[1]+layer.offset[1];out[2]=z*layer.scale[2]+layer.offset[2];return out;
}
