import { useEffect, useRef } from "react";

const POOL    = 1.8;
const WATER_Y = 1.0;
const SIM     = 256;
const GRID    = 256;
const CTEX    = 1024;

const EYE    = [1.8, 3.0, 1.0];
const CENTER = [0.6, WATER_Y, 0.4];
const UP     = [0.0, 1.0,  0.0];
const FOV    = 0.50;

function norm3(v) {
  const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
  return [v[0]/l, v[1]/l, v[2]/l];
}
function cross3(a, b) {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
function sub3(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function dot3(a, b)  { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }

function mat4Persp(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov * 0.5), nf = 1 / (near - far);
  return new Float32Array([
    f/aspect, 0, 0,               0,
    0,        f, 0,               0,
    0,        0, (far+near)*nf,  -1,
    0,        0, 2*far*near*nf,   0,
  ]);
}
function mat4LookAt(eye, center, up) {
  const f = norm3(sub3(center, eye));
  const r = norm3(cross3(f, up));
  const u = cross3(r, f);
  return new Float32Array([
    r[0],         u[0],        -f[0],       0,
    r[1],         u[1],        -f[1],       0,
    r[2],         u[2],        -f[2],       0,
    -dot3(r,eye), -dot3(u,eye), dot3(f,eye), 1,
  ]);
}
function mat4Mul(a, b) {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      for (let k = 0; k < 4; k++)
        o[j*4+i] += a[k*4+i] * b[j*4+k];
  return o;
}

function mouseToWaterUV(cx, cy, rect, aspect) {
  const ndcX =  ((cx - rect.left) / rect.width)  * 2 - 1;
  const ndcY = -(((cy - rect.top)  / rect.height) * 2 - 1);
  const fwd = norm3(sub3(CENTER, EYE));
  const rgt = norm3(cross3(fwd, UP));
  const upv = cross3(rgt, fwd);
  const th  = Math.tan(FOV * 0.5);
  const dir = norm3([
    fwd[0] + rgt[0]*ndcX*th*aspect + upv[0]*ndcY*th,
    fwd[1] + rgt[1]*ndcX*th*aspect + upv[1]*ndcY*th,
    fwd[2] + rgt[2]*ndcX*th*aspect + upv[2]*ndcY*th,
  ]);
  if (Math.abs(dir[1]) < 1e-5) return null;
  const t = (WATER_Y - EYE[1]) / dir[1];
  if (t <= 0) return null;
  const u = (EYE[0] + dir[0]*t) / POOL * 0.5 + 0.5;
  const v = (EYE[2] + dir[2]*t) / POOL * 0.5 + 0.5;
  return (u >= 0 && u <= 1 && v >= 0 && v <= 1) ? [u, v] : null;
}

// ─── shaders ──────────────────────────────────────────────────────────────────

const VS_QUAD = `#version 300 es
layout(location=0) in vec2 pos;
out vec2 uv;
void main(){ uv=pos*.5+.5; gl_Position=vec4(pos,0,1); }`;

const FS_DROP = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_center; uniform float u_radius, u_strength, u_min_radius;
in vec2 uv; out vec4 frag;
void main(){
  vec4 info = texture(u_tex, uv);
  float dist = length(uv - u_center);
  float r = (dist - u_min_radius) / u_radius;
  float wave = sin((dist - u_min_radius) * 90.0) * exp(-r*r*2.0);
  info.r += wave * u_strength;
  frag = info;
}`;

const FS_SIM = `#version 300 es
precision highp float;
uniform sampler2D u_tex; uniform vec2 u_delta;
in vec2 uv; out vec4 frag;
void main(){
  vec4 info = texture(u_tex, uv);
  vec2 dx = vec2(u_delta.x, 0.);
  vec2 dy = vec2(0., u_delta.y);
  float hL = texture(u_tex, uv - dx).r;
  float hR = texture(u_tex, uv + dx).r;
  float hD = texture(u_tex, uv - dy).r;
  float hU = texture(u_tex, uv + dy).r;
  float avg = (hL + hR + hD + hU) * 0.25;
  info.g += (avg - info.r) * 2.;
  info.g *= 0.94 / (1.0 + 0.45 * abs(info.g));
  info.r += info.g;
  info.b = (hR - hL) * 0.5;
  info.a = (hU - hD) * 0.5;
  frag = info;
}`;

const VS_CAUSTICS = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_uv;
uniform sampler2D u_water; uniform float u_waterY, u_pool, u_time;
out vec3 v_old, v_new;
const float ETA=1./1.333; const vec3 LIGHT=vec3(0.,-1.,0.);
float hashC(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noiseC(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hashC(i),hashC(i+vec2(1,0)),f.x),
             mix(hashC(i+vec2(0,1)),hashC(i+vec2(1,1)),f.x),f.y)*2.-1.;
}
float waveH(vec2 uv){
  float tt=u_time;
  return .022*noiseC(uv*6. +vec2(tt*.38,tt*.22))
        +.014*noiseC(uv*12.+vec2(tt*.61,tt*.45))
        +.007*noiseC(uv*22.+vec2(tt*.97,tt*.73));
}
void main(){
  vec4 info=texture(u_water,a_uv);
  float e=0.005;
  float hC=info.r+waveH(a_uv);
  float hX=texture(u_water,a_uv+vec2(e,0)).r+waveH(a_uv+vec2(e,0));
  float hZ=texture(u_water,a_uv+vec2(0,e)).r+waveH(a_uv+vec2(0,e));
  float dw=e*2.0*u_pool;
  vec3 ddx=vec3(dw,hX-hC,0.);
  vec3 ddz=vec3(0.,hZ-hC,dw);
  vec3 n=normalize(cross(ddz,ddx));
  vec3 wp=vec3((a_uv.x*2.-1.)*u_pool,u_waterY+hC,(a_uv.y*2.-1.)*u_pool);
  v_old=vec3(wp.x,0.,wp.z);
  vec3 refr=refract(LIGHT,n,ETA);
  if(dot(refr,refr)<.001||refr.y>=0.){v_new=v_old;gl_Position=vec4(2.,2.,0.,1.);return;}
  float t=wp.y/(-refr.y);
  v_new=wp+refr*t; v_new.y=0.;
  gl_Position=vec4(v_new.x/u_pool,v_new.z/u_pool,0.,1.);
}`;

const FS_CAUSTICS = `#version 300 es
precision highp float;
in vec3 v_old,v_new; out vec4 frag;
void main(){
  float oA=length(dFdx(v_old.xz))*length(dFdy(v_old.xz));
  float nA=length(dFdx(v_new.xz))*length(dFdy(v_new.xz));
  float I=min(.15*oA/max(nA,1e-7),3.);
  frag=vec4(I*.5,I*.88,I,1.);
}`;

const VS_FLOOR = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
uniform mat4 u_mvp;
uniform float u_pool;
out vec2 v_uv;
out vec2 v_rock;
void main() {
  float ext = u_pool * 2.0;
  vec3 w = vec3(a_pos.x * ext, 0., a_pos.y * ext);
  v_uv = w.xz / (u_pool * 2.0) + 0.5;
  v_rock = w.xz;
  gl_Position = u_mvp * vec4(w, 1.);
}`;

// ─── FS_FLOOR: replaced Voronoi with rock texture + kept caustics/distortion ──
const FS_FLOOR = `#version 300 es
precision highp float;
uniform sampler2D u_caustics, u_water, u_rock;
uniform float u_time, u_pool;
in vec2 v_uv;
in vec2 v_rock;
out vec4 frag;
void main(){
  float inside =
    step(0.0, v_uv.x) * step(0.0, v_uv.y) *
    step(v_uv.x, 1.0) * step(v_uv.y, 1.0);

  // rock texture — tiled, slightly darkened to look submerged
  vec2 rockUV = v_rock / u_pool * 0.75;
  vec3 col = texture(u_rock, rockUV).rgb * 0.45;

  // water distortion from surface gradient stored in .ba
  float drift = u_time * 0.006;
  vec2 ba = mix(
    texture(u_water, v_uv).ba,
    texture(u_water, fract(v_uv + vec2(drift, drift * 0.3))).ba,
    0.35
  );
  vec2 dis = ba * 0.035;

  float d = 1.5 / 512.;
  vec3 caus =
    (texture(u_caustics, v_uv + dis + vec2(-d,-d)).rgb +
     texture(u_caustics, v_uv + dis + vec2( d,-d)).rgb +
     texture(u_caustics, v_uv + dis + vec2(-d, d)).rgb +
     texture(u_caustics, v_uv + dis + vec2( d, d)).rgb) * 0.25;

  col += caus * inside * 2.5 * vec3(.5, 0.6, 0.4);
  frag = vec4(col, 1.);
}`;

const VS_WATER = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_uv;
uniform sampler2D u_sim;
uniform mat4 u_mvp; uniform float u_pool, u_waterY, u_time;
out vec3 v_normal, v_pos; out vec2 v_uv;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y)*2.-1.;
}
void main(){
  vec4 info = texture(u_sim, a_uv);
  float h = info.r;
  h = clamp(h, -0.5, 0.5);
  float t = u_time;
  h += .008*noise(a_uv*6. +vec2(t*0.38,t*0.22))
      +.005*noise(a_uv*12.+vec2(t*0.61,t*0.45))
      +.003*noise(a_uv*22.+vec2(t*0.97,t*0.73));
  float e = 0.003;
  float hL = texture(u_sim, a_uv - vec2(e,0.)).r;
  float hR = texture(u_sim, a_uv + vec2(e,0.)).r;
  float hD = texture(u_sim, a_uv - vec2(0.,e)).r;
  float hU = texture(u_sim, a_uv + vec2(0.,e)).r;
  float worldStep = e * 2.0 * u_pool;
  v_normal = normalize(vec3(hL-hR, worldStep, hD-hU));
  vec3 w = vec3((a_uv.x*2.-1.)*u_pool, u_waterY+h, (a_uv.y*2.-1.)*u_pool);
  v_pos = w; v_uv = a_uv;
  gl_Position = u_mvp*vec4(w,1.);
}`;

const FS_WATER = `#version 300 es
precision highp float;
uniform vec3 u_eye; uniform float u_time;
in vec3 v_normal, v_pos; in vec2 v_uv; out vec4 frag;
const vec3 SUN  = normalize(vec3(.4,1.,.3));
const vec3 DEEP = vec3(.022,.12,.17);
const vec3 MID  = vec3(.0,.22,.30);
vec3 skyColor(vec3 d){
  float up = max(d.y,0.);
  vec3 sky = mix(vec3(.55,.72,.88),vec3(.22,.48,.72),pow(up,.6));
  sky += pow(max(dot(d,SUN),0.),220.)*vec3(1.,.95,.80)*5.;
  return sky;
}
void main(){
  vec3 n    = normalize(v_normal);
  vec3 view = normalize(u_eye-v_pos);
  float vn  = max(dot(n,view),0.);
  float F   = .12+.88*pow(1.-vn,4.);
  vec3 refl = reflect(-view,n);
  vec3 sky  = skyColor(refl);
  vec3 water = mix(DEEP,MID,vn*.6);
  vec3 col  = mix(water,sky,F*.60);
  float sp  = pow(max(dot(refl,SUN),0.),120.);
  float sp2 = pow(max(dot(refl,SUN),0.),400.);
  col += sp*vec3(.95,.98,1.)*1.8 + sp2*vec3(1.,1.,1.)*3.0;
  float g = fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+u_time*1.7)*43758.5453)*.055-.028;
  col += g;

  // shimmer: shaped star highlights that flicker with surface normals
  vec2  shimUV    = floor(v_uv * 120.0);
  float shimSeed  = fract(sin(dot(shimUV, vec2(127.1,311.7)))*43758.5453);
  float shimSeed2 = fract(sin(dot(shimUV, vec2(269.5,183.3)))*43758.5453);
  float shimOn    = step(0.982, shimSeed);  // sparsity — raise toward .995 for fewer

  // unique normal per shimmer point
  vec3  shimDir = normalize(vec3(shimSeed*2.-1., 1.8, shimSeed2*2.-1.));

  // angle between reflection and shimmer normal drives the shape
  vec3  shimRefl  = refl;
  float shimDot   = max(dot(shimRefl, shimDir), 0.0);

  // two perpendicular tangents around shimDir to form cross arms
  vec3  shimTan1 = normalize(cross(shimDir, vec3(0.,1.,0.)));
  vec3  shimTan2 = normalize(cross(shimDir, shimTan1));
  float arm1 = pow(max(dot(shimRefl, shimTan1), 0.0), 3.0);
  float arm2 = pow(max(dot(shimRefl, shimTan2), 0.0), 3.0);

  // core bright point + four arms = star shape
  float shimCore = pow(shimDot, 80.0);
  float shimArms = (arm1 + arm2) * pow(shimDot, 8.0) * 0.4;
  float shimmer  = shimCore + shimArms;

  col += shimOn * shimmer * vec3(1.0, 0.97, 0.88) * 5.0;
  
  frag = vec4(col,.36+F*.18);
}`;

const FS_DISTURB = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform float u_time;
in vec2 uv; out vec4 frag;

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y)*2.0-1.0;
}

void main(){
  vec4 info = texture(u_tex, uv);
  float t = u_time * 0.001;

  // four wave trains moving in different directions
  float n =
    noise(uv*4.0  + vec2( t*1.3,  t*0.7 )) * 0.0012 +  // NE
    noise(uv*4.0  + vec2(-t*0.9,  t*1.1 )) * 0.0012 +  // NW
    noise(uv*7.0  + vec2( t*0.5, -t*1.4 )) * 0.0007 +  // SE
    noise(uv*7.0  + vec2(-t*1.2, -t*0.6 )) * 0.0007 +  // SW
    noise(uv*13.0 + vec2( t*1.7,  t*1.0 )) * 0.0003 +  // fine detail A
    noise(uv*13.0 + vec2(-t*1.0,  t*1.8 )) * 0.0003;   // fine detail B

  info.r += n;
  frag = info;
}`;

// ─── WebGL helpers ─────────────────────────────────────────────────────────────
function mkShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s)+'\n'+src.split('\n').map((l,i)=>`${i+1}: ${l}`).join('\n'));
  return s;
}
function mkProg(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, mkShader(gl, gl.VERTEX_SHADER,   vs));
  gl.attachShader(p, mkShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
function mkTexFloat(gl, size) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,size,size,0,gl.RGBA,gl.FLOAT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return t;
}
function mkTexHalf(gl, size) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,size,size,0,gl.RGBA,gl.HALF_FLOAT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return t;
}
function mkFBO(gl, tex) {
  const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
  const s = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (s !== gl.FRAMEBUFFER_COMPLETE) throw new Error('FBO: 0x'+s.toString(16));
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); return fbo;
}
function mkQuadVAO(gl) {
  const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.bindVertexArray(null); return vao;
}
function mkGridVAO(gl) {
  const N=GRID;
  const verts=new Float32Array((N+1)*(N+1)*2); let vi=0;
  for(let j=0;j<=N;j++) for(let i=0;i<=N;i++){verts[vi++]=i/N;verts[vi++]=j/N;}
  const idx=new Uint32Array(N*N*6); let ii=0;
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){
    const a=j*(N+1)+i,b=a+1,c=a+(N+1),d=c+1;
    idx[ii++]=a;idx[ii++]=b;idx[ii++]=c;idx[ii++]=b;idx[ii++]=d;idx[ii++]=c;
  }
  const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
  const vbuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vbuf);
  gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const ibuf=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);
  gl.bindVertexArray(null); return {vao,count:idx.length};
}
function uLocs(gl, prog, names) {
  const o={}; for(const n of names) o[n]=gl.getUniformLocation(prog,n); return o;
}

// ── moved inside useEffect so gl exists when called ───────────────────────────
function mkTexImage(gl, url) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([30, 25, 20, 255]));
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, t);
    // ── fix: correct texImage2D signature for HTMLImageElement ───────────────
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  };
  img.src = url;
  return t;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function KoiPond() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) { console.warn('WebGL2 not supported'); return; }
    if (!gl.getExtension('EXT_color_buffer_float')) {
      console.warn('EXT_color_buffer_float unavailable'); return;
    }

    let progDrop, progSim, progCaustic, progFloor, progWater, progDisturb;
    try {
      progDrop    = mkProg(gl, VS_QUAD,     FS_DROP);
      progSim     = mkProg(gl, VS_QUAD,     FS_SIM);
      progCaustic = mkProg(gl, VS_CAUSTICS, FS_CAUSTICS);
      progFloor   = mkProg(gl, VS_FLOOR,    FS_FLOOR);
      progWater   = mkProg(gl, VS_WATER,    FS_WATER);
      progDisturb = mkProg(gl, VS_QUAD,     FS_DISTURB);
    } catch(e) { console.error('KoiPond shader error:', e); return; }

    const simTex      = [mkTexFloat(gl, SIM), mkTexFloat(gl, SIM)];
    const simFBO      = [mkFBO(gl, simTex[0]), mkFBO(gl, simTex[1])];
    const causticsTex = mkTexHalf(gl, CTEX);
    const causticsFBO = mkFBO(gl, causticsTex);
    const quadVAO     = mkQuadVAO(gl);
    const grid        = mkGridVAO(gl);

    // ── rock texture — swap URL for your own image ────────────────────────────
    const rockTex = mkTexImage(gl, 'https://res.cloudinary.com/dak0zi45d/image/upload/v1779707760/everytexture.com-stock-nature-sand-00013-400x400_oeuxza.jpg');

    const uDrop    = uLocs(gl, progDrop,    ['u_tex','u_center','u_radius','u_strength','u_min_radius']);
    const uSim     = uLocs(gl, progSim,     ['u_tex','u_delta']);
    const uCaustic = uLocs(gl, progCaustic, ['u_water','u_waterY','u_pool','u_time']);
    const uFloor   = uLocs(gl, progFloor,   ['u_mvp','u_pool','u_caustics','u_water','u_rock','u_time']);
    const uWater   = uLocs(gl, progWater,   ['u_mvp','u_pool','u_waterY','u_time','u_eye','u_sim']);
    const uDisturb = uLocs(gl, progDisturb, ['u_tex','u_time']);

    const DELTA = new Float32Array([1/SIM, 1/SIM]);
    let cur = 0;
    const r0 = canvas.getBoundingClientRect();
    let canvasAspect = r0.height > 0 ? r0.width / r0.height : 1;

    const DROP_MIN_RADIUS = 0.07;
    const DROP_RADIUS     = 0.018;
    const DROP_STRENGTH   = 0.22;
    const RIPPLE_INTERVAL = 100;
    const MAX_RIPPLES     = 600;

    function addDrop(cx, cy) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, simFBO[1-cur]);
      gl.viewport(0, 0, SIM, SIM);
      gl.useProgram(progDrop);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simTex[cur]);
      gl.uniform1i(uDrop.u_tex, 0);
      gl.uniform2f(uDrop.u_center,     cx, cy);
      gl.uniform1f(uDrop.u_radius,     DROP_RADIUS);
      gl.uniform1f(uDrop.u_strength,   DROP_STRENGTH);
      gl.uniform1f(uDrop.u_min_radius, DROP_MIN_RADIUS);
      gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cur = 1-cur;
    }

    function disturb(t) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, simFBO[1-cur]);
      gl.viewport(0, 0, SIM, SIM);
      gl.useProgram(progDisturb);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simTex[cur]);
      gl.uniform1i(uDisturb.u_tex, 0);
      gl.uniform1f(uDisturb.u_time, t * 2);
      gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cur = 1-cur;
    }

    function stepSim() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, simFBO[1-cur]);
      gl.viewport(0, 0, SIM, SIM);
      gl.useProgram(progSim);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simTex[cur]);
      gl.uniform1i(uSim.u_tex, 0);
      gl.uniform2fv(uSim.u_delta, DELTA);
      gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cur = 1-cur;
    }

    function renderCaustics(t) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, causticsFBO);
      gl.viewport(0, 0, CTEX, CTEX);
      gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(progCaustic);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simTex[cur]);
      gl.uniform1i(uCaustic.u_water, 0);
      gl.uniform1f(uCaustic.u_waterY, WATER_Y);
      gl.uniform1f(uCaustic.u_pool,   POOL);
      gl.uniform1f(uCaustic.u_time,   t * 0.001);
      gl.bindVertexArray(grid.vao);
      gl.drawElements(gl.TRIANGLES, grid.count, gl.UNSIGNED_INT, 0);
      gl.disable(gl.BLEND);
    }

    function renderScene(mvp, t) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.03, 0.09, 0.12, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      gl.useProgram(progFloor);
      gl.uniformMatrix4fv(uFloor.u_mvp, false, mvp);
      gl.uniform1f(uFloor.u_pool, POOL);
      gl.uniform1f(uFloor.u_time, t * 0.001);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, causticsTex);
      gl.uniform1i(uFloor.u_caustics, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, simTex[cur]);
      gl.uniform1i(uFloor.u_water, 1);
      // ── TEXTURE2: rock image ───────────────────────────────────────────────
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, rockTex);
      gl.uniform1i(uFloor.u_rock, 2);
      gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.useProgram(progWater);
      gl.uniformMatrix4fv(uWater.u_mvp, false, mvp);
      gl.uniform1f(uWater.u_pool,   POOL);
      gl.uniform1f(uWater.u_waterY, WATER_Y);
      gl.uniform1f(uWater.u_time,   t * 0.001);
      gl.uniform3f(uWater.u_eye, EYE[0], EYE[1], EYE[2]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simTex[cur]);
      gl.uniform1i(uWater.u_sim, 0);
      gl.bindVertexArray(grid.vao);
      gl.drawElements(gl.TRIANGLES, grid.count, gl.UNSIGNED_INT, 0);

      gl.disable(gl.BLEND); gl.depthMask(true); gl.disable(gl.DEPTH_TEST);
    }

    const ro = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width  = Math.round(width  * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      if (height > 0) canvasAspect = width / height;
    });
    ro.observe(canvas);

    let isDragging  = false;
    let lastRipple  = 0;
    let rippleCount = 0;
    let curUV       = null;
    let prevUV      = null;

    const onMouseDown = (e) => {
      isDragging  = true;
      rippleCount = 0;
      lastRipple  = 0;
      prevUV      = null;
      const r = canvas.getBoundingClientRect();
      curUV = mouseToWaterUV(e.clientX, e.clientY, r, canvasAspect);
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const r = canvas.getBoundingClientRect();
      curUV = mouseToWaterUV(e.clientX, e.clientY, r, canvasAspect);
    };
    const onMouseUp = () => { isDragging = false; curUV = null; prevUV = null; };

    canvas.addEventListener("mousedown",  onMouseDown);
    canvas.addEventListener("mousemove",  onMouseMove, { passive: true });
    window.addEventListener("mouseup",    onMouseUp);

    let animId;
    const animate = (t) => {
      animId = requestAnimationFrame(animate);

      if (isDragging && curUV && rippleCount < MAX_RIPPLES) {
        const now   = performance.now();
        const moved = !prevUV ||
          (curUV[0]-prevUV[0])**2 + (curUV[1]-prevUV[1])**2 > 4e-6;
        if (moved && now - lastRipple >= RIPPLE_INTERVAL) {
          addDrop(curUV[0], curUV[1]);
          lastRipple  = now;
          rippleCount++;
          prevUV = [curUV[0], curUV[1]];
        }
      }

      disturb(t);
      stepSim();
      renderCaustics(t);

      const mvp = mat4Mul(
        mat4Persp(FOV, canvasAspect, 0.1, 50),
        mat4LookAt(EYE, CENTER, UP)
      );
      renderScene(mvp, t);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
    />
  );
}