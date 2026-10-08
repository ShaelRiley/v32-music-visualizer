// ANSI Tube's grading order. The original JS tables prepare exact tone ramps
// and finite lookup values; True Color bypasses the finite lookup entirely.
uniform highp sampler3D colors;
uniform sampler2D toneRamp;
uniform vec2 colorGrade,colorBoost;
uniform int colorMode,trueColor;
vec3 paletteColor(vec3 inputRGB){
 vec3 c=clamp(inputRGB,0.,255.);
 float peak=max(c.r,max(c.g,c.b)),trough=min(c.r,min(c.g,c.b));
 float saturation=peak==0.?0.:(peak-trough)/peak;
 if(saturation>=.02){float target=clamp(saturation*(1.+colorBoost.y)+.06,0.,1.);c=clamp(vec3(peak)-(vec3(peak)-c)*(target/saturation),0.,255.);}
 float valueScale=peak==0.?0.:min(255.,peak*(1.+colorBoost.x))/peak;
 c=floor(c*valueScale+.5);
 float luminance=clamp(floor(dot(c,vec3(.299,.587,.114))+.5),0.,255.);
 if(colorMode==1)c=floor(texelFetch(toneRamp,ivec2(int(luminance),0),0).rgb*255.+.5);
 else{
  if(colorMode==2)c=c.gbr;
  c=floor(clamp((vec3(luminance)+(c-vec3(luminance))*colorGrade.x-128.)*colorGrade.y+128.,0.,255.)+.5);
 }
 if(trueColor==1)return c/255.;
 ivec3 cell=ivec3(clamp(floor(c/8.),0.,31.));
 return texelFetch(colors,ivec3(cell.z,cell.y,cell.x),0).rgb;
}
