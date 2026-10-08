const float TAU=6.28318530718;
float sp(float a,float p){return sign(a)*pow(abs(a),p);}
vec3 shape(int op,vec2 uv) {
 float u=uv.x,v=uv.y,a=u*TAU,b=v*TAU,w=v*2.-1.,h=u*2.-1.,r=0.,q=0.,k=0.;vec3 p=vec3(0);
 if(op==0){r=1.05+.38*w*cos(1.5*a);p=vec3(r*cos(a),.62*w+.18*sin(3.*a),r*sin(a)+.24*w*sin(1.5*a));}
 else if(op==1){r=1.+.37*cos(b);p=vec3(r*cos(a),.37*sin(b),r*sin(a));}
 else if(op==2){r=1.+.12*sin(5.*a)*sin(3.*b);p=vec3(r*cos(a)*sin(3.14159265*v),r*cos(3.14159265*v),r*sin(a)*sin(3.14159265*v));}
 else if(op==3){a*=3.;r=.64+.12*cos(b);p=vec3(r*cos(a),2.*h+.13*sin(b),r*sin(a));}
 else if(op==4){p.x=2.*h;p.z=1.6*w;p.y=.3*sin(4.*p.x+2.*p.z+clock)+.2*cos(3.*p.z-1.4*clock);}
 else if(op==5){p.x=1.6*h;p.z=1.6*w;p.y=.5*(sin(p.x*3.)*cos(p.z*3.)+sin(p.z*3.)*cos(p.x*3.))+.18*sin(6.*p.x+6.*p.z);}
 else if(op==6){q=2.*a;r=.85+.3*cos(3.*a);p=vec3(r*cos(q)+.11*cos(b)*cos(q),.38*sin(3.*a)+.11*sin(b),r*sin(q)+.11*cos(b)*sin(q));}
 else if(op==7){k=floor(u*12.);q=fract(u*12.);r=.2+.8*q;p=vec3((mod(k,3.)-1.)*r*.72+.1*cos(b),q*1.6-.85+mod(floor(k/3.),2.)*.4,(floor(k/3.)-1.5)*r*.38+.1*sin(b));}
 else if(op==8){k=floor(u*7.);a=fract(u*7.)*TAU;r=.38;p=vec3(r*cos(a)*sin(3.14159265*v)+.72*cos(k*2.4),r*cos(3.14159265*v)+.4*sin(k*1.7),r*sin(a)*sin(3.14159265*v)+.72*sin(k*2.4));}
 else if(op==9){a*=3.;r=.16+u*1.3;p=vec3((r+.09*cos(b))*cos(a),.7*h+.09*sin(b),(r+.09*cos(b))*sin(a));}
 else if(op==10){r=.2+v;p=vec3(r*cos(a),1.8*(v-.5),r*sin(a));}
 else if(op==11){p.x=1.2*h;p.z=1.2*w;p.y=.55*(p.x*p.x-p.z*p.z);}
 else if(op==12){r=.46*cosh(1.5*w);p=vec3(r*cos(a),w,r*sin(a));}
 else if(op==13){r=1.+.42*w*cos(a*.5);p=vec3(r*cos(a),.42*w*sin(a*.5),r*sin(a));}
 else if(op==14){r=.62+.22*cos(b);p=vec3(r*cos(a)+.36*sin(a)*cos(a),.7*sin(a)+.22*sin(b),r*sin(a)*cos(a*.5)+.3*cos(b)*sin(a*.5));}
 else if(op==15){p=vec3(sp(sin(3.14159265*v),.45)*sp(cos(a),.45),sp(cos(3.14159265*v),.45),sp(sin(3.14159265*v),.45)*sp(sin(a),.45));}
 else if(op==16){r=.3+v*(.65+.25*cos(6.*a));p=vec3(r*cos(a),.3*sin(6.*a)*v+.25*v*v,r*sin(a));}
 else if(op==17){k=floor(u*18.);q=fract(u*18.);p=vec3((mod(k,3.)-1.)*.65,(mod(floor(k/3.),3.)-1.)*.65,(q*2.-1.)*1.2);if(k>8.){p.z=p.y;p.y=(q*2.-1.)*1.2;}p.x+=.045*cos(b);p.y+=.045*sin(b);}
 else if(op==18){r=.2+v*1.25;a+=v*5.;p=vec3(r*cos(a),1.2*(.5-v)+.18*sin(a*3.),r*sin(a));}
 else if(op==19){k=floor(v*6.);q=fract(v*6.);p=vec3(1.5*h,(k-2.5)*.3+.13*sin(1.5*h*3.+q*5.+k),2.*q-1.);}
 else if(op==20){r=.45+v*.7;p=vec3(r*cos(a),.24*sin(a*9.+v*5.),r*sin(a));}
 else if(op==21){k=floor(u*9.);q=fract(u*9.);r=.15+.75*q;a=k*2.4+q*1.4;p=vec3(r*cos(a)+.09*cos(b),1.3*q-.7+.12*sin(b),r*sin(a));}
 else if(op==22){r=sin(3.14159265*v);p=vec3(r*cos(a),.25*cos(3.14159265*v),r*sin(a));}
 else if(op==23){r=.16+.95*pow(abs(w),1.3);p=vec3(r*cos(a),w,r*sin(a));}
 else if(op==24){k=floor(u*24.);q=fract(u*24.);r=k<12.?.72:1.2;k=mod(k,12.);p=vec3(mod(k,4.)<2.?-r:r,mod(k,2.)>0.?-r:r,(2.*q-1.)*r);if(k>=4.&&k<8.){p.z=p.y;p.y=(2.*q-1.)*r;}if(k>=8.){p.z=p.x;p.x=(2.*q-1.)*r;}p.x+=.035*cos(b);p.y+=.035*sin(b);}
 else if(op==25){r=.85*(1.-.38*abs(w));q=floor(u*6.);a=q*TAU/6.+fract(u*6.)*TAU/6.;p=vec3(r*cos(a),w,r*sin(a));}
 else if(op==26){a*=2.;r=.15+u*.9;p=vec3(r*cos(a),1.6*w,r*sin(a)+.2*sin(w*4.));}
 else if(op==27){r=.15+v*1.2;p=vec3(r*cos(a),.28*sin(v*16.-clock*2.),r*sin(a));}
 else if(op==28){k=floor(v*3.);q=fract(v*3.);a=u*TAU*2.+k*TAU/3.;p=vec3(.45*cos(a)+.08*cos(q*TAU),2.*h,.45*sin(a)+.08*sin(q*TAU));}
 else if(op==29){a=u*3.14159265;r=1.+.25*cos(b);p=vec3(r*cos(a),r*sin(a)-.5,.25*sin(b));}
 else if(op==30){p.x=1.3*h;p.z=1.3*w;p.y=.38*sin(7.*p.x)*sin(7.*p.z)+.16*cos(3.*p.x+4.*p.z);}
 else {k=floor(v*12.);q=fract(v*12.);p=vec3(1.4*h,.14*sin(1.4*h*8.+k*3.14159265)+.03*sin(q*TAU),(k-5.5)*.22);}
 return p;
}
mat3 turn(vec3 r){float a=cos(r.x),b=sin(r.x),c=cos(r.y),d=sin(r.y),e=cos(r.z),f=sin(r.z);return mat3(e,f,0.,-f,e,0.,0.,0.,1.)*mat3(c,0.,d,0.,1.,0.,-d,0.,c)*mat3(1.,0.,0.,0.,a,b,0.,-b,a);}
vec3 surface(vec2 uv) {
 vec3 p=shape(op,uv);float signal=dot(features,mapping),phase=clock*.22+phaseOffset;
 if(relation>0){vec3 q=shape(partner,uv);
  if(relation==1)p=mix(p,q,.25+.25*sin(phase));
  if(relation==2)p+=.3*q;
  if(relation==3)p+=(p-q)*(.16/(.3+length(p-q)));
  if(relation==5)p+=.22*sin(uv.x*31.+uv.y*17.+phase)*q;
 }
 if(effect==1)p.y+=.42*sin(p.x*2.+phase)*sin(.5+signal);
 else if(effect==2){float a=p.y*(.45+signal*.5)+phase*.15;float c=cos(a),s=sin(a);p.xz=mat2(c,s,-s,c)*p.xz;}
 else if(effect==3)p.y+=.14*(.25+signal)*sin(9.*length(p.xz)-clock*2.);
 else if(effect==4)p.x+=sign(p.x)*(.12+.35*(.5+.5*sin(phase)))*signal;
 else if(effect==5)p*=.7+.3*sin(phase)+.15*signal;
 else if(effect==6){float a=phase*.4;float c=cos(a),s=sin(a);p.xz=mat2(c,s,-s,c)*p.xz;}
 else if(effect==7)p.y*=cos(phase*.5)*.65+.35;
 else if(effect==8){float q=.76+.24*cos(phase*.7);p.xz*=q;p.y+=.2*sin(phase+p.y*4.)*signal;}
 return (turn(rotation)*p*scaling+offset)*worldScale;
}
