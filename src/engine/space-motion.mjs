import {musicalActivity,musicalDrive} from '../audio/motion.mjs';
// Same bounded three-axis traveling field as the GPU, at an architectural gain.
export function warpSpacePoint(point,t,layer,features,gain){
 const [x,y,z]=point,a=musicalActivity(features),s=musicalDrive(features,layer.audio),p=layer.phase;
 return [x+gain*(.02+.20*a+.06*s)*Math.sin(y*1.8+z*1.1-t*.95+p),
  y+gain*((.025+.24*a+.12*s)*Math.sin(x*2.2+z*1.7-t*1.35+p)+.055*s*Math.sin(x*5.1-z*3.4-t*2.1+p)),
  z+gain*(.02+.13*a+.10*s)*Math.sin(y*1.6-x*1.4-t*.8+p*.7)];
}
export function railPoint(path,position){
 const n=path.length,at=((position%1)+1)%1*n,i=Math.floor(at),u=at-i;
 const p=[-1,0,1,2].map(j=>path[(i+j+n)%n]);
 return [0,1,2].map(k=>.5*((2*p[1][k])+(-p[0][k]+p[2][k])*u+(2*p[0][k]-5*p[1][k]+4*p[2][k]-p[3][k])*u*u+(-p[0][k]+3*p[1][k]-3*p[2][k]+p[3][k])*u*u*u));
}
