import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { projects } from "../../data/projects";
import { optimizeImage, videoPoster } from "../../utils/cloudinary";
import { DataUtils } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import DuckCard from "../DuckCard";
import { TiltShiftShader } from "./tiltShift";
import * as P from "./props";

/* ───────────────────────── Content ───────────────────────── */

const RESUME_URL = "https://drive.google.com/file/d/1qvzjvyCNFUYIFTxiBk1JDlgEpBxXouGc/view?usp=sharing";

// Everything floating in the pool. `href` makes it a link; `duck` opens the message card.
const PROPS = [
  { id: "duck", kind: "duck", label: "Talk to the duck", duck: true },
  { id: "resume", kind: "files", label: "Résumé (a little wet)", href: RESUME_URL },
  { id: "github", kind: "logo", logo: "github", label: "GitHub", href: "https://github.com/al371160" },
  { id: "linkedin", kind: "logo", logo: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/alexander-liu-282739206/" },
  { id: "email", kind: "logo", logo: "gmail", label: "Email", href: "mailto:aliu10@seas.upenn.edu" },
  { id: "itch", kind: "logo", logo: "itch", label: "itch.io", href: "https://al371160.itch.io/" },
  { id: "x", kind: "logo", logo: "x", label: "X", href: "https://x.com/a1ex1iu_cgart" },
  { id: "buoy1", kind: "buoy", label: "Life buoy" },
  { id: "buoy2", kind: "buoy", label: "Life buoy" },
  { id: "buoy3", kind: "buoy", label: "Life buoy" },
  { id: "beach1", kind: "beach", label: "Beach ball" },
  { id: "beach2", kind: "beach", label: "Beach ball" },
  // project props: click opens the project page, hover shows its hero image
  { id: "car", kind: "car", project: "penn-electric-racing" },
  { id: "beaker", kind: "beaker", project: "penn-labs" },
  { id: "phone", kind: "phone", project: "reimagining-reconnection" },
  { id: "boba", kind: "boba", project: "orble-tea" },
  { id: "creeper", kind: "creeper", project: "minecraft" },
];

// Resolve project props: label from the project title, preview from its thumbnail/hero.
for (const p of PROPS) {
  if (!p.project) continue;
  const proj = projects.find((x) => x.slug === p.project);
  p.label = proj?.title ?? p.project;
  const media = proj?.thumbnail || proj?.hero;
  if (media?.src) p.image = media.type === "video" ? videoPoster(media.src, 640) : optimizeImage(media.src, 640);
}

// Real models that replace a procedural prop. `url` is a .glb/.gltf or .obj;
// `map` is a texture for OBJs without a material file; `rotationY` turns the
// model so its front matches the prop's front in FACING (+x for the duck);
// `size` scales the prop (and its collider) relative to the stand-in.
const MODELS = {
  duck: {
    url: "/models/duck/classic-roblox-rubber-duckie/source/classic_rbx_duck.obj",
    map: "/models/duck/classic-roblox-rubber-duckie/textures/Duck1_diff.png",
    rotationY: -Math.PI / 2, // the mesh's beak points down -z
  },
};

// Which way each prop "faces", in its own local space, for the hover turn.
// `front` points at the camera; `up` stays screen-up. `side` props (duck, car…)
// turn toward the camera but stay mostly upright; `top` props tilt their printed
// face toward the camera so it reads head-on.
const FACING = {
  duck: { front: [1, 0, 0], up: [0, 1, 0], style: "side" },
  car: { front: [1, 0, 0], up: [0, 1, 0], style: "side" },
  creeper: { front: [0, 0, 1], up: [0, 1, 0], style: "side" },
  beaker: { front: [0, 0, 1], up: [0, 1, 0], style: "side" },
  boba: { front: [0, 0, 1], up: [0, 1, 0], style: "side" },
  files: { front: [0, 1, 0], up: [0, 0, -1], style: "top" },
  logo: { front: [0, 1, 0], up: [0, 0, -1], style: "top" },
  phone: { front: [0, 1, 0], up: [0, 0, -1], style: "top" },
  buoy: { front: [0, 1, 0], up: [0, 0, -1], style: "top" },
  beach: { front: [0, 1, 0], up: [0, 0, -1], style: "top" },
};

/* ───────────────────────── Pool constants ───────────────────────── */

// Simulated water domain (covers the visible frame); the floor extends past it.
const POOL_W = 32;
const POOL_D = 26;
const POOL_Z = 0;
const FLOOR_W = 44;
const FLOOR_D = 34;
const NX = 256;
const NZ = 208;
const DX = POOL_W / (NX - 1);
const DZ = POOL_D / (NZ - 1);
// Scales every ripple source (clicks, stirring, wakes, splashes).
const WAVE_STRENGTH = 0.6;
const FLOOR_Y = -1.15;
// Damped wave equation. WAVE_C2 sets the speed (cells per step squared, < 0.5
// for stability); lower = slower, softer ripples.
const WAVE_C2 = 0.04;
const WAVE_DAMP = 0.995;
const CAUSTIC_RES = 2048;
const PROP_SCALE = 1.55; // size of everything floating
const SIM_TO_CAUSTIC = 2.2; // how strongly ripples bend the caustics
// Tilt-shift: sharp band across the middle, blur toward the front, back and sides.
const TILT = { enabled: true, focus: 0.52, band: 0.14, ramp: 0.32, maxBlur: 14, side: 0.45 };

// Ambient surface motion: layered value noise drifting in different directions,
// so it never repeats visibly (same idea as the koi pond's waveH).
const WAVE_NOISE_GLSL = /* glsl */ `
  float hashC(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noiseC(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hashC(i), hashC(i + vec2(1, 0)), f.x),
               mix(hashC(i + vec2(0, 1)), hashC(i + vec2(1, 1)), f.x), f.y) * 2.0 - 1.0;
  }
  float waveH(vec2 p, float t) {
    // rotate each octave so the grid axes of the noise never line up
    vec2 a = mat2(0.8, -0.6, 0.6, 0.8) * p;
    vec2 b = mat2(0.28, 0.96, -0.96, 0.28) * p;
    return 0.26 * noiseC(p * 0.47 + vec2(t * 0.55, t * 0.34))
         + 0.14 * noiseC(a * 0.95 + vec2(-t * 0.8, t * 0.6))
         + 0.05 * noiseC(b * 1.9 + vec2(t * 1.05, -t * 0.88));
  }
`;

// Caustics as in the WebGL Water tutorial: refract the sun through every
// vertex of a fine grid over the water, land it on the floor, and measure how
// much each triangle shrank (light focuses) or grew (light spreads).
const CAUSTIC_VERT = /* glsl */ `
  uniform sampler2D uHeight;
  uniform vec2 uSize;
  uniform vec2 uTexel;
  uniform float uDepth;
  uniform float uTime;
  uniform vec3 uLight;
  varying vec3 vOld;
  varying vec3 vNew;
  ${WAVE_NOISE_GLSL}
  float surf(vec2 uvp) {
    vec2 w = (uvp - 0.5) * uSize;
    return texture2D(uHeight, uvp).r * ${SIM_TO_CAUSTIC.toFixed(2)} + waveH(w, uTime);
  }
  void main() {
    vec2 w = (uv - 0.5) * uSize;
    float hC = surf(uv);
    float hX = surf(uv + vec2(uTexel.x, 0.0));
    float hZ = surf(uv + vec2(0.0, uTexel.y));
    vec3 ddx = vec3(uTexel.x * uSize.x, hX - hC, 0.0);
    vec3 ddz = vec3(0.0, hZ - hC, uTexel.y * uSize.y);
    vec3 n = normalize(cross(ddz, ddx));
    vec3 ray = refract(-uLight, n, 1.0 / 1.333);
    vec3 ray0 = refract(-uLight, vec3(0.0, 1.0, 0.0), 1.0 / 1.333);
    vec3 p = vec3(w.x, hC, w.y);
    vNew = p + ray * ((uDepth + hC) / max(-ray.y, 0.05));
    vOld = vec3(w.x, 0.0, w.y) + ray0 * (uDepth / -ray0.y);
    gl_Position = vec4(vNew.xz / uSize * 2.0, 0.0, 1.0);
  }
`;
const CAUSTIC_FRAG = /* glsl */ `
  varying vec3 vOld;
  varying vec3 vNew;
  void main() {
    float oldArea = length(dFdx(vOld.xz)) * length(dFdy(vOld.xz));
    float newArea = length(dFdx(vNew.xz)) * length(dFdy(vNew.xz));
    float I = min(oldArea / max(newArea, 1e-7), 6.0);
    gl_FragColor = vec4(I, I, I, 1.0);
  }
`;

function skyEnvironment(renderer, sunDir) {
  const envScene = new THREE.Scene();
  envScene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(10, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: { uSun: { value: sunDir.clone().normalize() } },
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `
          uniform vec3 uSun; varying vec3 vP;
          void main(){
            float h = vP.y * 0.5 + 0.5;
            vec3 c = mix(vec3(0.08, 0.32, 0.5), vec3(0.75, 0.9, 1.0), smoothstep(0.35, 1.0, h));
            float s = pow(max(dot(vP, uSun), 0.0), 600.0) * 60.0;
            gl_FragColor = vec4(c * 0.55 + s, 1.0);
          }`,
      })
    )
  );
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0);
  pmrem.dispose();
  envScene.traverse((o) => o.geometry && (o.geometry.dispose(), o.material.dispose()));
  return rt;
}

// Lens-flare sprite for sparkles: hot core, soft glow, long cross streaks and
// shorter diagonal ones. White, drawn additively.
function flareTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const m = 64;
  const glow = ctx.createRadialGradient(m, m, 0, m, m, 40);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.12, "rgba(255,255,255,0.85)");
  glow.addColorStop(0.35, "rgba(255,255,255,0.18)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);
  const streak = (angle, len, thick, alpha) => {
    ctx.save();
    ctx.translate(m, m);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(-len, 0, len, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-len, -thick / 2, len * 2, thick);
    ctx.restore();
  };
  streak(0, 62, 3, 0.95);
  streak(Math.PI / 2, 62, 3, 0.95);
  streak(Math.PI / 4, 30, 2, 0.5);
  streak(-Math.PI / 4, 30, 2, 0.5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Soft round droplet sprite.
function dropTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.8)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Remember where every prop is, so returning to the page (or reloading)
// doesn't reshuffle the pool. Module memory covers in-app navigation;
// localStorage covers reloads. Both are best-effort.
const LAYOUT_KEY = "pool-layout-v1";
let layoutMemory = null;
function loadLayout() {
  if (layoutMemory) return layoutMemory;
  try {
    const raw = window.localStorage.getItem(LAYOUT_KEY);
    if (raw) layoutMemory = JSON.parse(raw);
  } catch {
    /* storage blocked: fall back to a fresh random layout */
  }
  return layoutMemory;
}
function saveLayout(objs) {
  const layout = {};
  for (const o of objs) layout[o.id] = [+o.x.toFixed(3), +o.z.toFixed(3), +o.yaw.toFixed(3)];
  layoutMemory = layout;
  try {
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
}

/* ───────────────────────── Component ───────────────────────── */

export default function PoolScene({ onFirstFrame }) {
  const wrapRef = useRef(null);
  const cursorRef = useRef(null);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const focusRef = useRef(null);
  const openDuckRef = useRef(() => {});
  // where the duck's talk box is pinned (page coords), or null when closed
  const [duckAt, setDuckAt] = useState(null);
  const duckStepRef = useRef(null); // current step of the duck's talk box
  const duckOpen = !!duckAt;
  const setDuckOpen = (open) => setDuckAt(open ? { x: window.innerWidth / 2 - 150, y: window.scrollY + 140 } : null);
  // open next to the cursor: the box right of the plus becomes the talk box
  openDuckRef.current = (vx, vy) => setDuckAt({ x: vx + 14, y: vy - 14 + window.scrollY });
  // refs the render loop reads without restarting the effect
  const duckOpenRef = useRef(false);
  duckOpenRef.current = duckOpen;
  const onFirstFrameRef = useRef(onFirstFrame);
  onFirstFrameRef.current = onFirstFrame;

  useEffect(() => {
    const wrap = wrapRef.current;
    const cursorEl = cursorRef.current;
    const cursorLabel = cursorEl.querySelector(".pool-cursor-label");
    const cursorImg = cursorEl.querySelector(".pool-cursor-img");
    // warm the hero images so the hover card appears instantly
    for (const p of PROPS) if (p.image) new Image().src = p.image;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    /* ── renderer / scene ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft is deprecated in this three.js and falls back to this anyway
    renderer.domElement.className = "pool-canvas";
    wrap.prepend(renderer.domElement);
    const canvas = renderer.domElement;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e0e);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const timeU = { value: 0 };

    // a single bright sun, slightly behind the top of the frame so shadows fall
    // down and to the side across the floor
    const SUN_DIR = new THREE.Vector3(-0.3, 1, -0.38).normalize();
    const envRT = skyEnvironment(renderer, SUN_DIR);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.6;
    scene.add(new THREE.AmbientLight(0x5fc4ff, 0.35));
    const sun = new THREE.DirectionalLight(0xfffaf0, 3.6);
    sun.position.copy(SUN_DIR).multiplyScalar(20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 });
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);


    /* ── water height field (CPU wave sim) ── */
    let cur = new Float32Array(NX * NZ);
    let prev = new Float32Array(NX * NZ);
    let next = new Float32Array(NX * NZ);
    const heightHalf = new Uint16Array(NX * NZ);
    const heightTex = new THREE.DataTexture(heightHalf, NX, NZ, THREE.RedFormat, THREE.HalfFloatType);
    heightTex.magFilter = heightTex.minFilter = THREE.LinearFilter;
    heightTex.needsUpdate = true;

    /* ── caustics render target: light refracted through the surface onto the floor ── */
    const causticRT = new THREE.WebGLRenderTarget(CAUSTIC_RES, Math.round((CAUSTIC_RES * POOL_D) / POOL_W), {
      type: THREE.HalfFloatType,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      depthBuffer: false,
    });
    const causticScene = new THREE.Scene();
    const causticCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const causticMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 440, 360),
      new THREE.ShaderMaterial({
        uniforms: {
          uHeight: { value: heightTex },
          uSize: { value: new THREE.Vector2(POOL_W, POOL_D) },
          uTexel: { value: new THREE.Vector2(1 / 440, 1 / 360) },
          uDepth: { value: -FLOOR_Y },
          uTime: timeU,
          uLight: { value: SUN_DIR.clone() },
        },
        vertexShader: CAUSTIC_VERT,
        fragmentShader: CAUSTIC_FRAG,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
    );
    causticMesh.frustumCulled = false;
    causticScene.add(causticMesh);

    /* ── pool floor: deep blue, lit by the caustics only where the sun reaches ── */
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a64a8, roughness: 0.85 });
    floorMat.onBeforeCompile = (sh) => {
      sh.uniforms.uCaustics = { value: causticRT.texture };
      sh.uniforms.uSize = { value: new THREE.Vector2(POOL_W, POOL_D) };
      sh.uniforms.uHeight = { value: heightTex };
      sh.uniforms.uHTexel = { value: new THREE.Vector2(1 / NX, 1 / NZ) };
      sh.uniforms.uCTexel = { value: new THREE.Vector2(1 / CAUSTIC_RES, 1 / CAUSTIC_RES) };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform sampler2D uCaustics; uniform vec2 uSize; uniform vec2 uCTexel;
          uniform sampler2D uHeight; uniform vec2 uHTexel;
          varying vec3 vWPos;`
        )
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
          vec2 cuv = vWPos.xz / uSize + 0.5;
          vec2 slope = vec2(
            texture2D(uHeight, cuv + vec2(uHTexel.x, 0.0)).r - texture2D(uHeight, cuv - vec2(uHTexel.x, 0.0)).r,
            texture2D(uHeight, cuv + vec2(0.0, uHTexel.y)).r - texture2D(uHeight, cuv - vec2(0.0, uHTexel.y)).r);
          cuv += slope * 0.35;
          vec2 d = uCTexel * 0.75;
          float I = (texture2D(uCaustics, cuv + vec2(-d.x, -d.y)).r + texture2D(uCaustics, cuv + vec2(d.x, -d.y)).r +
                     texture2D(uCaustics, cuv + vec2(-d.x, d.y)).r + texture2D(uCaustics, cuv + vec2(d.x, d.y)).r) * 0.25;
          vec2 edge = min(cuv, 1.0 - cuv);
          I = mix(1.0, I, smoothstep(0.0, 0.04, min(edge.x, edge.y)));
          reflectedLight.directDiffuse *= 0.18 + pow(I, 1.8) * 0.82;`
        );
    };
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, FLOOR_D).rotateX(-Math.PI / 2), floorMat);
    floor.position.set(0, FLOOR_Y, POOL_Z);
    floor.receiveShadow = true;
    scene.add(floor);

    /* ── water surface: clear, glossy, faintly tinted ── */
    const waterGeo = new THREE.PlaneGeometry(POOL_W, POOL_D, NX - 1, NZ - 1).rotateX(-Math.PI / 2);
    waterGeo.translate(0, 0, POOL_Z);
    const water = new THREE.Mesh(
      waterGeo,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          void main() {
            gl_FragColor = vec4(0.62, 0.88, 1.0, 0.06);
          }`,
      })
    );
    water.renderOrder = 1;
    scene.add(water);
    const wpos = waterGeo.attributes.position;

    const cellOf = (x, z) => [(x + POOL_W / 2) / DX, (z - POOL_Z + POOL_D / 2) / DZ];
    const heightAt = (x, z) => {
      const [gx, gz] = cellOf(x, z);
      const ix = Math.max(0, Math.min(NX - 2, Math.floor(gx)));
      const iz = Math.max(0, Math.min(NZ - 2, Math.floor(gz)));
      const fx = Math.min(1, Math.max(0, gx - ix));
      const fz = Math.min(1, Math.max(0, gz - iz));
      const i = iz * NX + ix;
      return (cur[i] * (1 - fx) + cur[i + 1] * fx) * (1 - fz) + (cur[i + NX] * (1 - fx) + cur[i + NX + 1] * fx) * fz;
    };
    const disturb = (x, z, radius, amount) => {
      const [gx, gz] = cellOf(x, z);
      const rc = Math.ceil(radius / DX) + 1;
      for (let dz = -rc; dz <= rc; dz++)
        for (let dx = -rc; dx <= rc; dx++) {
          const ix = Math.round(gx) + dx;
          const iz = Math.round(gz) + dz;
          if (ix < 1 || iz < 1 || ix >= NX - 1 || iz >= NZ - 1) continue;
          const d2 = ((ix - gx) * DX) ** 2 + ((iz - gz) * DZ) ** 2;
          cur[iz * NX + ix] += amount * WAVE_STRENGTH * Math.exp(-d2 / (radius * radius));
        }
    };
    const stepWater = () => {
      for (let z = 1; z < NZ - 1; z++) {
        const row = z * NX;
        for (let x = 1; x < NX - 1; x++) {
          const i = row + x;
          const c = cur[i];
          const lap = cur[i - 1] + cur[i + 1] + cur[i - NX] + cur[i + NX] - 4 * c;
          // the trailing factor slowly relaxes any leftover raised/sunken water back
          // to flat, so splashes don't leave a permanent "crest" behind
          next[i] = (c + (c - prev[i]) * WAVE_DAMP + WAVE_C2 * lap) * 0.997;
        }
      }
      const t = prev;
      prev = cur;
      cur = next;
      next = t;
    };

    /* ── props ── */
    const gltfLoader = new GLTFLoader();
    const objLoader = new OBJLoader();

    const texLoader = new THREE.TextureLoader();
    // resolves once the mesh *and* its texture are fully loaded
    const loadModel = async (cfg) => {
      if (/\.obj$/i.test(cfg.url)) {
        const [obj, map] = await Promise.all([
          objLoader.loadAsync(cfg.url),
          cfg.map ? texLoader.loadAsync(cfg.map) : Promise.resolve(null),
        ]);
        if (map) {
          map.colorSpace = THREE.SRGBColorSpace;
          map.anisotropy = 8;
          obj.traverse((o) => {
            if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ map, roughness: 0.5 });
          });
        }
        return obj;
      }
      return (await gltfLoader.loadAsync(cfg.url)).scene;
    };
    // the page loader waits for these, so nothing pops in after the reveal
    let pendingModels = 0;
    const build = (p) => {
      if (p.kind === "duck") return P.duck();
      if (p.kind === "files") return P.files();
      if (p.kind === "logo") return P.logoBall(p.logo);
      if (p.kind === "buoy") return P.buoy();
      if (p.kind === "beach") return P.beachBall();
      return P[p.kind]();
    };
    const objs = PROPS.map((p, index) => {
      const built = build(p);
      const g = built.group;
      g.traverse((o) => {
        if (o.isMesh && !o.userData.isOutline) {
          o.castShadow = true;
          o.userData.propIndex = index;
        }
      });
      scene.add(g);
      if (MODELS[p.kind]) {
        const cfg = MODELS[p.kind];
        pendingModels++;
        g.visible = false; // hide the stand-in until the real model is in
        loadModel(cfg)
          .then((mesh) => {
          // pivot: turn the mesh to face +x, fit it to the prop's footprint
          const model = new THREE.Group();
          mesh.rotation.y = cfg.rotationY ?? 0;
          model.add(mesh);
          model.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          model.scale.setScalar((built.radius * 2 * (cfg.size ?? 1)) / Math.max(size.x, size.z));
          model.updateMatrixWorld(true);
          // centre it over the prop and sit its base just under the waterline
          box.setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.set(-center.x, -box.min.y - 0.15, -center.z);
          model.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.userData.propIndex = index;
            }
          });
          g.clear();
          g.add(model);
          const o = objs[index];
          if (o) {
            o.outlines = [];
            addOutline(o, model);
          }
          })
          .catch((err) => console.warn(`Couldn't load ${cfg.url}, using the stand-in`, err))
          .finally(() => {
            g.visible = true;
            pendingModels--;
          });
      }
      return {
        ...p, ...built, index, group: g,
        radius: built.radius * PROP_SCALE * (MODELS[p.kind]?.size ?? 1),
        draft: built.draft * PROP_SCALE,
        x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0,
        yaw: Math.random() * Math.PI * 2, vyaw: (Math.random() - 0.5) * 0.3,
        roll: new THREE.Quaternion(), baseQuat: new THREE.Quaternion(), hover: 0, spinBoost: 0, frozen: false,
        dispY: 0, clear: 0, settling: false, wet: 1, dripAt: 0, bobPhase: Math.random() * Math.PI * 2,
      };
    });
    // thick white outline (inverted hull) shown on the hovered/held prop
    const FLAT_GEO = /Plane|Circle/;
    const addOutline = (o, root) => {
      if (!o.outlineMat) {
        o.outlineMat = new THREE.ShaderMaterial({
          uniforms: { uWidth: { value: 0.07 }, uOpacity: { value: 0 } },
          vertexShader: /* glsl */ `
            uniform float uWidth;
            void main() {
              vec4 wp = modelMatrix * vec4(position, 1.0);
              wp.xyz += normalize(mat3(modelMatrix) * normal) * uWidth;
              gl_Position = projectionMatrix * viewMatrix * wp;
            }`,
          fragmentShader: /* glsl */ `
            uniform float uOpacity;
            void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, uOpacity); }`,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        });
        o.outlines = [];
      }
      const meshes = [];
      root.traverse((m) => {
        if (!m.isMesh || m.userData.isOutline || m.userData.pickOnly) return;
        if (FLAT_GEO.test(m.geometry.type)) return;
        meshes.push(m);
      });
      for (const m of meshes) {
        const line = new THREE.Mesh(m.geometry, o.outlineMat);
        line.userData.isOutline = true;
        line.raycast = () => {};
        line.renderOrder = 2;
        line.visible = false;
        m.add(line);
        o.outlines.push(line);
      }
    };
    objs.forEach((o) => addOutline(o, o.group));

    const duckObj = objs[0];
    const phoneObj = objs.find((o) => o.kind === "phone");

    /* ── phone sparks ── */
    const SPARKS = 90;
    const sparkPos = new Float32Array(SPARKS * 3);
    const sparkCol = new Float32Array(SPARKS * 3);
    const sparkVel = new Float32Array(SPARKS * 3);
    const sparkLife = new Float32Array(SPARKS);
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    sparkGeo.setAttribute("color", new THREE.BufferAttribute(sparkCol, 3));
    const sparks = new THREE.Points(
      sparkGeo,
      new THREE.PointsMaterial({
        size: 0.42,
        map: flareTexture(),
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sparks.frustumCulled = false;
    scene.add(sparks);
    let nextBurst = 1;
    let sparkSlot = 0;
    const tmpV = new THREE.Vector3();
    const burst = (count) => {
      phoneObj.group.localToWorld(tmpV.copy(phoneObj.sparkOrigin));
      for (let k = 0; k < count; k++) {
        const i = sparkSlot++ % SPARKS;
        sparkPos.set([tmpV.x, tmpV.y, tmpV.z], i * 3);
        const a = Math.random() * Math.PI * 2;
        const sp = 0.6 + Math.random() * 1.6;
        sparkVel.set([Math.cos(a) * sp, 1.5 + Math.random() * 2.2, Math.sin(a) * sp], i * 3);
        sparkLife[i] = 0.35 + Math.random() * 0.45;
      }
    };

    /* ── water droplets: drips off lifted props, splashes on impacts ── */
    const DROPS = 320;
    const dropPos = new Float32Array(DROPS * 3);
    const dropCol = new Float32Array(DROPS * 3);
    const dropVel = new Float32Array(DROPS * 3);
    const dropLife = new Float32Array(DROPS);
    const dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute("position", new THREE.BufferAttribute(dropPos, 3));
    dropGeo.setAttribute("color", new THREE.BufferAttribute(dropCol, 3));
    const drops = new THREE.Points(
      dropGeo,
      new THREE.PointsMaterial({
        size: 0.15,
        map: dropTexture(),
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    drops.frustumCulled = false;
    scene.add(drops);
    let dropSlot = 0;
    let rippleBudget = 0;
    const spawnDrop = (x, y, z, vx, vy, vz, life) => {
      const i = dropSlot++ % DROPS;
      dropPos.set([x, y, z], i * 3);
      dropVel.set([vx, vy, vz], i * 3);
      dropLife[i] = life;
    };
    const splashDrops = (x, z, count, power) => {
      if (reduceMotion) return;
      const y = heightAt(x, z) + 0.05;
      for (let k = 0; k < count; k++) {
        const a = Math.random() * Math.PI * 2;
        const out = (0.5 + Math.random()) * power;
        spawnDrop(x + Math.cos(a) * 0.15, y, z + Math.sin(a) * 0.15, Math.cos(a) * out, (1.6 + Math.random() * 1.8) * power, Math.sin(a) * out, 1.2);
      }
    };

    /* ── layout: spread props over the visible water ── */
    const bounds = { zFar: -6, zNear: 4, halfFar: 8, halfNear: 5 };
    const ray = new THREE.Raycaster();
    const hitWater = (ndcX, ndcY, out) => {
      ray.setFromCamera({ x: ndcX, y: ndcY }, camera);
      const t = -ray.ray.origin.y / ray.ray.direction.y;
      if (!(t > 0)) return false;
      out.copy(ray.ray.origin).addScaledVector(ray.ray.direction, t);
      return true;
    };
    const halfAt = (z) => {
      const k = (z - bounds.zFar) / (bounds.zNear - bounds.zFar);
      return bounds.halfFar + (bounds.halfNear - bounds.halfFar) * Math.max(0, Math.min(1, k));
    };

    /* ── tilt-shift post-processing: two separable blur iterations ── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const tiltPasses = [];
    for (let k = 0; k < 2; k++) {
      for (const axis of ["x", "y"]) {
        const pass = new ShaderPass(TiltShiftShader);
        pass.uniforms.uDir.value = new THREE.Vector2();
        pass.uniforms.uFocus.value = TILT.focus;
        pass.uniforms.uBand.value = TILT.band;
        pass.uniforms.uRamp.value = TILT.ramp;
        // second iteration at half radius smooths out the 9-tap banding
        pass.uniforms.uMaxBlur.value = k === 0 ? TILT.maxBlur : TILT.maxBlur * 0.5;
        pass.uniforms.uSide.value = TILT.side;
        pass.uniforms.uFocusX.value = 0.5;
        pass.enabled = TILT.enabled;
        pass.userData = { axis };
        tiltPasses.push(pass);
        composer.addPass(pass);
      }
    }
    composer.addPass(new OutputPass());

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      const pr = renderer.getPixelRatio();
      for (const pass of tiltPasses) {
        if (pass.userData.axis === "x") pass.uniforms.uDir.value.set(1 / (w * pr), 0);
        else pass.uniforms.uDir.value.set(0, 1 / (h * pr));
      }
      camera.aspect = w / h;
      // near-overhead view, tilted a little so props keep some depth
      const dist = Math.min(26, Math.max(15, 10 / (0.61 * camera.aspect)));
      const tilt = THREE.MathUtils.degToRad(42);
      camera.position.set(0, Math.cos(tilt) * dist, Math.sin(tilt) * dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      if (hitWater(-0.9, 0.86, a) && hitWater(0.9, 0.86, b)) {
        bounds.zFar = a.z;
        bounds.halfFar = Math.abs(b.x - a.x) / 2;
      }
      // on tall screens keep props above the intro panel
      if (hitWater(-0.9, -0.88, a) && hitWater(0.9, -0.88, b)) {
        bounds.zNear = a.z;
        bounds.halfNear = Math.abs(b.x - a.x) / 2;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // initial layout: restore the saved spots; anything without one (first
    // visit, or a newly added prop) gets a random non-overlapping position
    {
      const saved = loadLayout() || {};
      const placed = [];
      for (const o of objs) {
        const s = saved[o.id];
        if (!s) continue;
        const m = o.radius + 0.15;
        o.z = Math.max(bounds.zFar + m + 0.3, Math.min(bounds.zNear - m, s[1]));
        const half = halfAt(o.z) - m;
        o.x = Math.max(-half, Math.min(half, s[0]));
        o.yaw = s[2];
        o.restored = true;
        placed.push({ x: o.x, z: o.z, r: o.radius });
      }
      const order = objs.map((_, i) => i).sort(() => Math.random() - 0.5);
      order.forEach((oi) => {
        const o = objs[oi];
        if (o.restored) {
          o.y = -o.draft;
          o.dispY = o.y;
          return;
        }
        let x = 0;
        let z = 0;
        for (let tries = 0; tries < 80; tries++) {
          const m = o.radius + 0.35;
          z = bounds.zFar + m + Math.random() * Math.max(0.1, bounds.zNear - bounds.zFar - 2 * m);
          const half = Math.max(0.1, halfAt(z) - m);
          x = (Math.random() * 2 - 1) * half;
          let clear = true;
          for (const p of placed) if (Math.hypot(p.x - x, p.z - z) < p.r + o.radius + 0.12) clear = false;
          if (clear) break;
        }
        placed.push({ x, z, r: o.radius });
        o.x = x;
        o.z = z;
        o.y = -o.draft; // start floating in place, no entrance animation
        o.dispY = o.y;
      });
    }

    /* ── pointer ── */
    const pointer = { px: -100, py: -100, ndc: new THREE.Vector2(), world: new THREE.Vector3(), onWater: false, inside: false, lastMove: -10, down: null, moved: 0 };
    let hovered = null;
    let lastActive = null; // prop hovered/focused last frame; it holds still
    let grabbed = null; // prop held by the pointer until mouseup
    const grabOffset = new THREE.Vector2();
    const grabTarget = new THREE.Vector2();
    let hoverBlockedUntil = 0; // a just-thrown prop shouldn't re-freeze under the cursor
    const pickProp = () => {
      ray.setFromCamera(pointer.ndc, camera);
      const hits = ray.intersectObjects(objs.map((o) => o.group), true);
      const hit = hits.find((h) => h.object.userData.propIndex != null && objs[h.object.userData.propIndex].group.visible);
      return hit ? objs[hit.object.userData.propIndex] : null;
    };
    const setPointer = (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.px = e.clientX - r.left;
      pointer.py = e.clientY - r.top;
      pointer.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      pointer.onWater = hitWater(pointer.ndc.x, pointer.ndc.y, pointer.world);
    };
    const onMove = (e) => {
      const before = pointer.world.clone();
      setPointer(e);
      pointer.inside = true;
      pointer.lastMove = clock;
      if (pointer.down) {
        pointer.moved += Math.hypot(e.clientX - pointer.down.x, e.clientY - pointer.down.y);
        pointer.down = { x: e.clientX, y: e.clientY };
        if (grabbed) {
          if (pointer.onWater) grabTarget.set(pointer.world.x + grabOffset.x, pointer.world.z + grabOffset.y);
          return;
        }
        // stirring: a trail of small ripples that also shoves nearby props
        if (pointer.onWater) {
          disturb(pointer.world.x, pointer.world.z, 0.5, -0.012);
          const dx = pointer.world.x - before.x;
          const dz = pointer.world.z - before.z;
          for (const o of objs) {
            const d = Math.hypot(o.x - pointer.world.x, o.z - pointer.world.z);
            if (d < 2) {
              o.vx += dx * 7 * (1 - d / 2);
              o.vz += dz * 7 * (1 - d / 2);
            }
          }
        }
      }
    };
    const onDown = (e) => {
      setPointer(e);
      pointer.down = { x: e.clientX, y: e.clientY };
      pointer.moved = 0;
      canvas.setPointerCapture?.(e.pointerId);
      const p = pickProp();
      if (p && pointer.onWater) {
        grabbed = p;
        p.y = p.dispY + p.clear; // pick it up from exactly where it's drawn
        p.dispY = p.y;
        p.clear = 0;
        p.settling = false;
        grabOffset.set(p.x - pointer.world.x, p.z - pointer.world.z);
        grabTarget.set(p.x, p.z);
      }
    };
    const act = (o) => {
      if (o.duck) {
        o.vy += 2.2;
        disturb(o.x, o.z, 0.6, -0.05);
        // "Click on me again to continue": the second duck click goes to More Work
        if (duckOpenRef.current && duckStepRef.current === "more") {
          navigateRef.current("/playground");
          return;
        }
        const box = canvas.getBoundingClientRect();
        openDuckRef.current(box.left + pointer.px, box.top + pointer.py);
      } else if (o.project) {
        navigateRef.current(`/work/${o.project}`);
      } else if (o.href) {
        if (o.href.startsWith("mailto:")) window.location.href = o.href;
        else window.open(o.href, "_blank", "noopener,noreferrer");
      } else {
        // decorative props hop, spin and splash
        o.vy += 2.6;
        o.spinBoost = 6;
        disturb(o.x, o.z, 0.6, -0.07);
        if (o.kind === "phone") burst(40);
      }
    };
    const onUp = (e) => {
      canvas.releasePointerCapture?.(e.pointerId);
      const wasClick = pointer.down && pointer.moved < 6;
      pointer.down = null;
      if (grabbed) {
        const g = grabbed;
        g.y = g.group.position.y; // drop from where it was shown, not from below
        g.dispY = g.y;
        g.clear = 0;
        grabbed = null;
        if (wasClick) {
          act(g);
        } else {
          // throw it with the drag speed; it drops back and splashes
          const sp = Math.hypot(g.vx, g.vz);
          const k = sp > 5 ? 5 / sp : 1;
          g.vx *= k;
          g.vz *= k;
          g.vy = 0;
          g.settling = true;
          hoverBlockedUntil = clock + 0.6;
        }
        return;
      }
      if (!wasClick) return;
      const o = pickProp();
      if (o) {
        act(o);
      } else if (pointer.onWater) {
        disturb(pointer.world.x, pointer.world.z, 0.6, -0.1);
        for (const p of objs) {
          const dx = p.x - pointer.world.x;
          const dz = p.z - pointer.world.z;
          const d = Math.hypot(dx, dz) || 1;
          if (d < 3.2) {
            const f = (1 - d / 3.2) * 3;
            p.vx += (dx / d) * f;
            p.vz += (dz / d) * f;
          }
        }
      }
    };
    const onLeave = () => {
      if (grabbed) return; // pointer capture keeps the drag alive outside the canvas
      pointer.inside = false;
      hovered = null;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    /* ── simulation loop ── */
    const qYaw = new THREE.Quaternion();
    const qTilt = new THREE.Quaternion();
    const qStep = new THREE.Quaternion();
    const eTilt = new THREE.Euler();
    const axis = new THREE.Vector3();
    const UP = new THREE.Vector3(0, 1, 0);

    // rotation that points a prop's front at the camera with its up kept screen-up
    const faceLocal = new THREE.Matrix4();
    const faceWorld = new THREE.Matrix4();
    const qFace = new THREE.Quaternion();
    const fL = new THREE.Vector3();
    const uL = new THREE.Vector3();
    const sL = new THREE.Vector3();
    const F = new THREE.Vector3();
    const U = new THREE.Vector3();
    const S = new THREE.Vector3();
    const camUp = new THREE.Vector3();
    // turning a prop to face the camera can swing part of it below the water
    // (an upright résumé, a tilted ball). Push it up until its lowest point clears.
    const clearBox = new THREE.Box3();
    const ease = (t) => t * t * (3 - 2 * t);
    // Apply a prop's pose with smoothing: height, scale and the keep-above-water
    // push all ease toward their targets instead of snapping between states.
    const showProp = (o, targetY, dt) => {
      const h = ease(o.hover);
      const k = 1 - Math.exp(-dt * 14);
      o.dispY += (targetY - o.dispY) * k;
      o.group.position.set(o.x, o.dispY + o.clear, o.z);
      o.group.scale.setScalar(PROP_SCALE * (1 + h * 0.14));
      let need = 0;
      if (h > 0.001 || o.clear > 0.001) {
        o.group.updateMatrixWorld(true);
        clearBox.setFromObject(o.group);
        const surface = heightAt(o.x, o.z) + 0.04;
        need = Math.max(0, surface - (clearBox.min.y - o.clear));
      }
      o.clear += (need - o.clear) * (1 - Math.exp(-dt * 10));
      o.group.position.y = o.dispY + o.clear;
    };

    const faceCamera = (o) => {
      const cfg = FACING[o.kind];
      if (!cfg) return null;
      fL.fromArray(cfg.front);
      uL.fromArray(cfg.up);
      sL.crossVectors(uL, fL).normalize();
      faceLocal.makeBasis(sL, uL, fL);
      F.set(camera.position.x - o.x, camera.position.y - o.y, camera.position.z - o.z).normalize();
      if (cfg.style === "side") {
        // mostly turn around the vertical axis, with a gentle nod toward the lens
        F.y = 0;
        F.normalize().addScaledVector(UP, 0.45).normalize();
        U.copy(UP);
      } else {
        camUp.setFromMatrixColumn(camera.matrixWorld, 1);
        U.copy(camUp);
      }
      S.crossVectors(U, F).normalize();
      U.crossVectors(F, S).normalize();
      faceWorld.makeBasis(S, U, F);
      faceWorld.multiply(faceLocal.transpose());
      return qFace.setFromRotationMatrix(faceWorld);
    };
    let clock = 0;
    let wanderAt = 0;
    const wander = new THREE.Vector3();
    let raf = 0;
    let last = performance.now();
    let firstFrame = true;

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      clock += dt;
      timeU.value = clock;

      // water
      stepWater();
      stepWater();

      // duck steering
      const chase = pointer.inside && pointer.onWater && clock - pointer.lastMove < 3;
      if (!chase && clock > wanderAt) {
        wanderAt = clock + 4 + Math.random() * 4;
        wander.z = bounds.zFar + 1 + Math.random() * (bounds.zNear - bounds.zFar - 2);
        wander.x = (Math.random() - 0.5) * 2 * (halfAt(wander.z) - 1);
      }
      const target = chase ? pointer.world : wander;
      {
        const dx = target.x - duckObj.x;
        const dz = target.z - duckObj.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.7 && !duckOpenRef.current) {
          const accel = chase ? 2.4 : 0.9;
          duckObj.vx += (dx / d) * accel * dt;
          duckObj.vz += (dz / d) * accel * dt;
        }
        const sp = Math.hypot(duckObj.vx, duckObj.vz);
        const max = chase ? 1.8 : 0.8;
        if (sp > max) {
          duckObj.vx *= max / sp;
          duckObj.vz *= max / sp;
        }
        if (sp > 0.08) {
          const want = Math.atan2(-duckObj.vz, duckObj.vx);
          let diff = want - duckObj.yaw;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          duckObj.yaw += diff * Math.min(1, dt * 4);
          duckObj.vyaw = 0;
        }
      }

      // ripples only drag props that are near an active cursor
      const pointerLive = pointer.inside && pointer.onWater && clock - pointer.lastMove < 1;

      // props
      for (const o of objs) {

        // hovered: freeze in place (no drift, bob, tilt or spin) and face the camera
        o.frozen = o === lastActive || o === grabbed;
        if (o === grabbed) {
          // follow the cursor, held a little above the water, facing the camera
          const m = o.radius + 0.15;
          const tz = Math.max(bounds.zFar + m + 0.3, Math.min(bounds.zNear - m, grabTarget.y));
          const half = halfAt(tz) - m;
          const tx = Math.max(-half, Math.min(half, grabTarget.x));
          const k = 1 - Math.exp(-dt * 16);
          const nx = o.x + (tx - o.x) * k;
          const nz = o.z + (tz - o.z) * k;
          o.vx = (nx - o.x) / Math.max(dt, 1e-3);
          o.vz = (nz - o.z) / Math.max(dt, 1e-3);
          o.x = nx;
          o.z = nz;
          const hold = heightAt(o.x, o.z) - o.draft + 0.45 * PROP_SCALE;
          o.y += (hold - o.y) * k;
          o.vy = 0;
          const sp = Math.hypot(o.vx, o.vz);
          if (sp > 0.3) disturb(o.x, o.z, o.radius * 0.6, -0.004 * Math.min(sp, 4));
          o.group.quaternion.copy(o.baseQuat);
          const face = faceCamera(o);
          if (face) o.group.quaternion.slerp(face, ease(o.hover));
          showProp(o, o.y, dt);
          continue;
        }
        if (o.frozen) {
          o.vx = o.vz = o.vy = 0;
          o.spinBoost = 0;
          o.group.quaternion.copy(o.baseQuat);
          const face = faceCamera(o);
          if (face) o.group.quaternion.slerp(face, ease(o.hover));
          showProp(o, o.y + ease(o.hover) * 0.28 * PROP_SCALE, dt);
          continue;
        }
        const e = 0.25;
        const gx = (heightAt(o.x + e, o.z) - heightAt(o.x - e, o.z)) / (2 * e);
        const gz = (heightAt(o.x, o.z + e) - heightAt(o.x, o.z - e)) / (2 * e);
        // waves push props downhill, a lazy current keeps things drifting
        const near = pointerLive ? Math.max(0, 1 - Math.hypot(o.x - pointer.world.x, o.z - pointer.world.z) / 2.5) : 0;
        const slope = 0.25 + 4 * near;
        o.vx += (-gx * slope + Math.sin(clock * 0.1 + o.index) * 0.02) * dt;
        o.vz += (-gz * slope + Math.cos(clock * 0.13 + o.index * 1.7) * 0.02) * dt;
        const drag = Math.exp(-dt * (o.duck ? 1.2 : 0.7));
        o.vx *= drag;
        o.vz *= drag;
        o.x += o.vx * dt;
        o.z += o.vz * dt;

        // keep inside the visible water
        const m = o.radius + 0.15;
        const zMin = bounds.zFar + m + 0.3;
        const zMax = bounds.zNear - m;
        if (o.z < zMin) { o.z = zMin; o.vz = Math.abs(o.vz) * 0.5; }
        if (o.z > zMax) { o.z = zMax; o.vz = -Math.abs(o.vz) * 0.5; }
        const half = halfAt(o.z) - m;
        if (o.x < -half) { o.x = -half; o.vx = Math.abs(o.vx) * 0.5; }
        if (o.x > half) { o.x = half; o.vx = -Math.abs(o.vx) * 0.5; }

        // wake
        const sp = Math.hypot(o.vx, o.vz);
        if (sp > 0.25 && Math.random() < 0.5) disturb(o.x - o.vx * 0.2, o.z - o.vz * 0.2, o.radius * 0.7, -0.0025 * sp);

        // buoyancy spring
        const fr = o.radius * 0.6;
        const footprint =
          (heightAt(o.x, o.z) * 2 + heightAt(o.x + fr, o.z) + heightAt(o.x - fr, o.z) + heightAt(o.x, o.z + fr) + heightAt(o.x, o.z - fr)) / 6;
        // slow individual bob on top of the ripples
        const bob = reduceMotion ? 0 : Math.sin(clock * 1.1 + o.bobPhase) * 0.035 * PROP_SCALE;
        const surface = Math.max(-0.035, Math.min(0.05, footprint)) - o.draft + bob;
        if (o.settling) {
          // released: glide back down to the water instead of springing
          const k = 1 - Math.exp(-dt * 3.2);
          const ny = o.y + (surface - o.y) * k;
          o.vy = (ny - o.y) / Math.max(dt, 1e-3);
          o.y = ny;
          if (Math.abs(o.y - surface) < 0.012) {
            o.settling = false;
            o.vy = 0;
            disturb(o.x, o.z, o.radius * 0.8, -0.035);
            splashDrops(o.x, o.z, 6, 0.6);
          }
        } else {
          o.vy += ((surface - o.y) * 40 - o.vy * 5 - (o.y > surface + 0.05 ? 9 : 0)) * dt;
          o.y += o.vy * dt;
          if (o.vy < -1.2 && o.y < surface) {
            disturb(o.x, o.z, o.radius, -0.05); // splash on landing
            splashDrops(o.x, o.z, 10, 0.9);
            o.vy *= 0.4;
          }
        }

        // orientation
        o.spinBoost *= Math.exp(-dt * 2);
        if (!o.duck) o.yaw += (o.vyaw * 0.4 + o.spinBoost) * dt;
        const rock = reduceMotion ? 0 : 0.05;
        eTilt.set(
          Math.max(-0.22, Math.min(0.22, gz * 1.2)) + Math.sin(clock * 0.9 + o.bobPhase * 1.3) * rock,
          0,
          Math.max(-0.22, Math.min(0.22, -gx * 1.2)) + Math.cos(clock * 0.75 + o.bobPhase) * rock
        );
        qTilt.setFromEuler(eTilt);
        if (o.tumble && sp > 0.01) {
          axis.set(o.vz, 0, -o.vx).normalize();
          qStep.setFromAxisAngle(axis, (sp * dt) / o.radius);
          o.roll.premultiply(qStep);
        }
        qYaw.setFromAxisAngle(UP, o.yaw);
        o.group.quaternion.copy(qTilt).multiply(o.tumble ? o.roll : qYaw);
        o.baseQuat.copy(o.group.quaternion);
        if (o.hover > 0.001) {
          const face = faceCamera(o);
          if (face) o.group.quaternion.slerp(face, ease(o.hover));
        }
        // floating props follow the water directly; lifts/turns ease via showProp
        if (!o.settling && o.hover < 0.001 && o.clear < 0.001) o.dispY = o.y;
        showProp(o, o.y + ease(o.hover) * 0.28 * PROP_SCALE, dt);
      }

      // collisions
      for (let i = 0; i < objs.length; i++)
        for (let j = i + 1; j < objs.length; j++) {
          const a = objs[i];
          const b = objs[j];
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const d = Math.hypot(dx, dz);
          const min = a.radius + b.radius;
          // a frozen (hovered) prop acts like a wall: only the other one moves
          const wa = a.frozen ? 0 : 1;
          const wb = b.frozen ? 0 : 1;
          if (d > 0 && d < min && wa + wb > 0) {
            const nx = dx / d;
            const nz = dz / d;
            const push = min - d;
            a.x -= nx * push * (wa / (wa + wb));
            a.z -= nz * push * (wa / (wa + wb));
            b.x += nx * push * (wb / (wa + wb));
            b.z += nz * push * (wb / (wa + wb));
            const rel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
            if (rel < -1.1 && !reduceMotion) {
              // fast hit: spray at the contact point
              const cx = a.x + nx * a.radius;
              const cz = a.z + nz * a.radius;
              splashDrops(cx, cz, Math.min(22, Math.round(-rel * 6)), Math.min(1.4, -rel * 0.35));
              disturb(cx, cz, 0.35, -0.03 * Math.min(3, -rel));
            }
            if (rel < 0) {
              const imp = (-rel * 0.8) / (wa + wb);
              a.vx -= nx * imp * wa;
              a.vz -= nz * imp * wa;
              b.vx += nx * imp * wb;
              b.vz += nz * imp * wb;
            }
          }
        }

      // sparks
      if (!reduceMotion && clock > nextBurst) {
        nextBurst = clock + 0.8 + Math.random() * 2.2;
        burst(10 + Math.floor(Math.random() * 14));
      }
      for (let i = 0; i < SPARKS; i++) {
        if (sparkLife[i] <= 0) {
          sparkCol[i * 3] = sparkCol[i * 3 + 1] = sparkCol[i * 3 + 2] = 0;
          continue;
        }
        sparkLife[i] -= dt;
        sparkVel[i * 3 + 1] -= 6 * dt;
        sparkPos[i * 3] += sparkVel[i * 3] * dt;
        sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * dt;
        sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
        const k = Math.max(0, sparkLife[i] / 0.6);
        sparkCol[i * 3] = k;
        sparkCol[i * 3 + 1] = k;
        sparkCol[i * 3 + 2] = k;
      }
      sparkGeo.attributes.position.needsUpdate = true;
      sparkGeo.attributes.color.needsUpdate = true;

      // drips: wet props held above the water shed drops for a couple of seconds
      for (const o of objs) {
        if (!o.group.visible) continue;
        // floating rest height is (surface - draft); anything well above that is lifted
        const lifted = o.group.position.y > heightAt(o.x, o.z) - o.draft + 0.15;
        if (!lifted) {
          o.wet = 1;
          continue;
        }
        o.wet = Math.max(0, o.wet - dt / 2.6);
        if (reduceMotion || o.wet <= 0 || clock < o.dripAt) continue;
        o.dripAt = clock + 0.05 + (1 - o.wet) * 0.25 + Math.random() * 0.08;
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * o.radius * 0.7;
        spawnDrop(o.x + Math.cos(a) * r, o.group.position.y - 0.05, o.z + Math.sin(a) * r, o.vx * 0.3, -0.2, o.vz * 0.3, 1.5);
      }
      rippleBudget = 6;
      for (let i = 0; i < DROPS; i++) {
        if (dropLife[i] <= 0) {
          dropCol[i * 3] = dropCol[i * 3 + 1] = dropCol[i * 3 + 2] = 0;
          continue;
        }
        dropLife[i] -= dt;
        dropVel[i * 3 + 1] -= 9.8 * dt;
        dropPos[i * 3] += dropVel[i * 3] * dt;
        dropPos[i * 3 + 1] += dropVel[i * 3 + 1] * dt;
        dropPos[i * 3 + 2] += dropVel[i * 3 + 2] * dt;
        const wx = dropPos[i * 3];
        const wz = dropPos[i * 3 + 2];
        if (dropVel[i * 3 + 1] < 0 && dropPos[i * 3 + 1] < heightAt(wx, wz)) {
          dropLife[i] = 0;
          if (rippleBudget-- > 0) disturb(wx, wz, 0.12, -0.012);
          continue;
        }
        const c = Math.min(1, dropLife[i] * 2) * 0.85;
        dropCol[i * 3] = c * 0.85;
        dropCol[i * 3 + 1] = c * 0.95;
        dropCol[i * 3 + 2] = c;
      }
      dropGeo.attributes.position.needsUpdate = true;
      dropGeo.attributes.color.needsUpdate = true;

      // water mesh
      for (let i = 0; i < NX * NZ; i++) heightHalf[i] = DataUtils.toHalfFloat(cur[i]);
      heightTex.needsUpdate = true;
      for (let i = 0; i < NX * NZ; i++) wpos.setY(i, Math.max(-0.05, Math.min(0.05, cur[i])));
      wpos.needsUpdate = true;
      waterGeo.computeVertexNormals();

      // hover + tooltip
      if (pointer.inside && !pointer.down) {
        // sticky hover: turning to face the camera changes a prop's silhouette, so
        // keep it hovered while the cursor stays near its footprint instead of
        // letting it flip back and forth at the edge of its collider
        const stay =
          hovered &&
          hovered.group.visible &&
          pointer.onWater &&
          Math.hypot(pointer.world.x - hovered.x, pointer.world.z - hovered.z) < hovered.radius * 1.5 + 0.25;
        if (!stay) hovered = pickProp();
      }
      const focused = focusRef.current != null ? objs.find((o) => o.id === focusRef.current) : null;
      if (clock < hoverBlockedUntil) hovered = null;
      const active = grabbed || hovered || focused;
      lastActive = active;
      for (const o of objs) o.hover += ((o === active ? 1 : 0) - o.hover) * Math.min(1, dt * 7);
      // outline fades with the hover amount
      for (const o of objs) {
        const op = ease(o.hover);
        if (!o.outlineMat) continue;
        o.outlineMat.uniforms.uOpacity.value = op;
        for (const line of o.outlines) line.visible = op > 0.01;
      }

      // tilt-shift focus slides to the active prop
      let fx = 0.5;
      let fy = TILT.focus;
      if (active) {
        tmpV.set(active.x, active.group.position.y, active.z).project(camera);
        fx = THREE.MathUtils.clamp((tmpV.x + 1) / 2, 0.1, 0.9);
        fy = THREE.MathUtils.clamp((tmpV.y + 1) / 2, 0.1, 0.9);
      }
      const kf = 1 - Math.exp(-dt * 5);
      for (const pass of tiltPasses) {
        pass.uniforms.uFocus.value += (fy - pass.uniforms.uFocus.value) * kf;
        pass.uniforms.uFocusX.value += (fx - pass.uniforms.uFocusX.value) * kf;
      }

      // custom cursor: black box with a white plus, label (and hero image) beside it
      // the card is fixed to the viewport (portaled to <body>), so convert
      // canvas-local coordinates to window coordinates
      const box = canvas.getBoundingClientRect();
      let cx = box.left + pointer.px;
      let cy = box.top + pointer.py;
      if (!pointer.inside && focused) {
        tmpV.set(focused.x, focused.y + focused.radius, focused.z).project(camera);
        cx = box.left + ((tmpV.x + 1) / 2) * box.width;
        cy = box.top + ((1 - tmpV.y) / 2) * box.height;
      }
      cursorEl.style.transform = `translate(${cx}px, ${cy}px)`;
      // the plus cursor only appears over things you can click through to
      const clickable = !!active && !!(active.href || active.project || active.duck);
      const showPlus = clickable && (pointer.inside || !!focused);
      cursorEl.classList.toggle("is-on", showPlus);
      canvas.style.cursor = showPlus ? "none" : grabbed || pointer.down ? "grabbing" : hovered ? "grab" : "default";
      const showLabel = !!active && !(active.duck && duckOpenRef.current);
      const labelKey = showLabel ? active.id : "";
      if (cursorEl.dataset.key !== labelKey) {
        cursorEl.dataset.key = labelKey;
        cursorLabel.textContent = showLabel ? active.label : "";
        cursorEl.classList.toggle("has-label", showLabel);
        if (active?.image) {
          cursorImg.src = active.image;
          cursorEl.classList.add("has-image");
        } else {
          cursorEl.classList.remove("has-image");
        }
      }

      renderer.setRenderTarget(causticRT);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.render(causticScene, causticCam);
      renderer.setRenderTarget(null);
      composer.render(dt);
      if (firstFrame && pendingModels === 0) {
        firstFrame = false;
        onFirstFrameRef.current?.();
      }
    };

    const run = () => {
      if (!raf && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVis = () => (document.hidden ? stop() : run());
    document.addEventListener("visibilitychange", onVis);
    run();

    const saveTimer = setInterval(() => saveLayout(objs), 2000);
    const onHide = () => saveLayout(objs);
    window.addEventListener("pagehide", onHide);

    return () => {
      clearInterval(saveTimer);
      window.removeEventListener("pagehide", onHide);
      saveLayout(objs);
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        if (!o.geometry) return;
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          Object.values(m).forEach((v) => v?.isTexture && v.dispose());
          m.dispose();
        });
      });
      envRT.dispose();
      heightTex.dispose();
      composer.dispose();
      causticRT.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div className="pool" ref={wrapRef}>
      {/* rendered into <body> so it can sit above everything and spill past the pool's edges */}
      {createPortal(
        <div className="pool-cursor" ref={cursorRef} aria-hidden="true">
          <div className="pool-cursor-row">
            <span className="pool-cursor-plus" />
            <span className="pool-cursor-label" />
          </div>
          <img className="pool-cursor-img" alt="" />
        </div>,
        document.body
      )}
      <nav className="pool-links" aria-label="Links">
        <button type="button" onClick={() => setDuckOpen(true)} onFocus={() => (focusRef.current = "duck")} onBlur={() => (focusRef.current = null)}>
          Talk to the duck
        </button>
        {PROPS.filter((p) => p.href || p.project).map((p) => (
          <a
            key={p.id}
            href={p.project ? `/work/${p.project}` : p.href}
            target={p.href && !p.href.startsWith("mailto:") ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => {
              if (!p.project) return;
              e.preventDefault();
              navigate(`/work/${p.project}`);
            }}
            onFocus={() => (focusRef.current = p.id)}
            onBlur={() => (focusRef.current = null)}
          >
            {p.label}
          </a>
        ))}
      </nav>
      {duckAt &&
        createPortal(
          <DuckCard
            anchor={duckAt}
            onStep={(step) => (duckStepRef.current = step)}
            onClose={() => {
              duckStepRef.current = null;
              setDuckAt(null);
            }}
          />,
          document.body
        )}
    </div>
  );
}
