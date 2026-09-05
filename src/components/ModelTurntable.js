import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ── Drop a .glb / .gltf URL here and it will be loaded into the turntable. ──
const MODEL_URL = "";

// ── ASCII dithering shader settings ──
const ASCII_CHARACTERS = ` .:,'-^=*+?!|0#X%WM@`; // dark → light
const ASCII_CELL_SIZE = 8; // px per cell
const ASCII_COLOR = 0xf2f4ff;
const ASCII_TEXTURE_SIZE = 1024;
const ATLAS_PER_ROW = 16;
const ATLAS_FONT_SIZE = 54;

const ORBIT_SPEED = 0.5;

function makePlaceholder() {
  const group = new THREE.Group();

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0x9fb7ff,
      metalness: 0.85,
      roughness: 0.35,
    })
  );
  group.add(cube);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cube.geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
  );
  group.add(edges);

  return group;
}

// Draws the characters into a Canvas atlas once, then stores as a texture.
function createCharactersTexture() {
  const canvas = document.createElement("canvas");
  const cell = ASCII_TEXTURE_SIZE / ATLAS_PER_ROW;
  canvas.width = canvas.height = ASCII_TEXTURE_SIZE;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, ASCII_TEXTURE_SIZE, ASCII_TEXTURE_SIZE);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${ATLAS_FONT_SIZE}px "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < ASCII_CHARACTERS.length; i++) {
    const char = ASCII_CHARACTERS[i];
    const x = i % ATLAS_PER_ROW;
    const y = Math.floor(i / ATLAS_PER_ROW);
    ctx.fillText(char, x * cell + cell / 2, y * cell + cell / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

// Adapted from emilwidlund/ASCII (runs as an offscreen post-processing pass).
// Samples the scene in a cell grid, maps luminance → an atlas character, and
// applies an ordered Bayer dither before quantization to avoid banding.
const ASCII_FRAGMENT = `
precision highp float;

uniform sampler2D tDiffuse;
uniform sampler2D uCharacters;
uniform float uCharactersCount;
uniform float uCellSize;
uniform float uInvert;
uniform vec3 uColor;
uniform vec2 uResolution;

const vec2 ATLAS = vec2(float(${ATLAS_PER_ROW}));

vec3 greyscale(vec3 color) {
  float g = dot(color, vec3(0.299, 0.587, 0.114));
  return vec3(g);
}

float bayer4(vec2 p) {
  vec2 c = floor(mod(p, 4.0));
  int idx = int(c.y) * 4 + int(c.x);
  float m[16];
  m[0]  = 0.0;  m[1]  = 8.0;  m[2]  = 2.0;  m[3]  = 10.0;
  m[4]  = 12.0; m[5]  = 4.0;  m[6]  = 14.0; m[7]  = 6.0;
  m[8]  = 3.0;  m[9]  = 11.0; m[10] = 1.0;  m[11] = 9.0;
  m[12] = 15.0; m[13] = 7.0;  m[14] = 13.0; m[15] = 5.0;
  return (m[idx] + 0.5) / 16.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 cell = uResolution / uCellSize;
  vec2 grid = 1.0 / cell;

  vec2 pixelizedUV = grid * (0.5 + floor(uv / grid));
  vec4 pixelized = texture2D(tDiffuse, pixelizedUV);

  float greyscaled = greyscale(pixelized.rgb).r;
  if (uInvert > 0.5) greyscaled = 1.0 - greyscaled;

  // ordered dither — break luminance banding across char levels
  float dither = (bayer4(floor(uv * cell)) - 0.5) / (uCharactersCount - 1.0);
  greyscaled = clamp(greyscaled + dither, 0.0, 1.0);

  float characterIndex = floor((uCharactersCount - 1.0) * greyscaled);
  vec2 characterPosition = vec2(mod(characterIndex, ATLAS.x), floor(characterIndex / ATLAS.y));
  vec2 offsetUV = vec2(characterPosition.x, -characterPosition.y) / ATLAS;
  vec2 charUV = mod(uv * (cell / ATLAS), 1.0 / ATLAS) - vec2(0.0, 1.0 / ATLAS) + offsetUV;
  vec4 asciiCharacter = texture2D(uCharacters, charUV);

  asciiCharacter.rgb = uColor * asciiCharacter.r;
  gl_FragColor = asciiCharacter;
}
`;

export default function ModelTurntable() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ——— Scene (rendered to an offscreen buffer) ———
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(2.4, 1.6, 2.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2030, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(4, 6, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 1.2);
    rim.position.set(-5, 2, -4);
    scene.add(rim);

    const pivot = new THREE.Group();
    const object = makePlaceholder();
    pivot.add(object);
    scene.add(pivot);

    const setModel = (model) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3()).length();
      const factor = 2.4 / (size || 1);
      model.scale.multiplyScalar(factor);
      const center = box.getCenter(new THREE.Vector3());
      const modelGroup = new THREE.Group();
      modelGroup.add(model);
      modelGroup.position.sub(center.multiplyScalar(factor));
      pivot.add(modelGroup);
    };

    const loader = new GLTFLoader();
    if (MODEL_URL) {
      loader.load(
        MODEL_URL,
        (gltf) => {
          pivot.remove(object);
          setModel(gltf.scene);
          render();
        },
        undefined,
        () => {
          // fallback placeholder stays if the model fails to load
        }
      );
    }

    // ——— ASCII post-processing pass ———
    const rt = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    const charactersTexture = createCharactersTexture();

    const asciiUniforms = {
      tDiffuse: { value: rt.texture },
      uCharacters: { value: charactersTexture },
      uCharactersCount: { value: ASCII_CHARACTERS.length },
      uCellSize: { value: ASCII_CELL_SIZE },
      uInvert: { value: 0 },
      uColor: { value: new THREE.Color(ASCII_COLOR) },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };

    const asciiMaterial = new THREE.ShaderMaterial({
      vertexShader: "void main() { gl_Position = vec4(position, 1.0); }",
      fragmentShader: ASCII_FRAGMENT,
      uniforms: asciiUniforms,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), asciiMaterial);
    quad.frustumCulled = false;
    const quadScene = new THREE.Scene();
    quadScene.add(quad);

    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    quadCamera.position.z = 1;
    quadCamera.lookAt(0, 0, 0);

    const render = () => {
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCamera);
    };

    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight, true);

      const w = Math.round(clientWidth * dpr);
      const h = Math.round(clientHeight * dpr);
      rt.setSize(w, h);
      asciiUniforms.tDiffuse.value = rt.texture;
      asciiUniforms.uResolution.value.set(w, h);
      asciiUniforms.uCellSize.value = ASCII_CELL_SIZE * dpr;

      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      render();
    };
    resize();
    requestAnimationFrame(resize);
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Drag rotates the object around its own axes (Y for horizontal, X for vertical)
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = (e.clientX - lastX) * 0.01;
      const dy = (e.clientY - lastY) * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;

      pivot.rotation.y += dx;
      pivot.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pivot.rotation.x + dy));
      render();
    };
    const onPointerUp = () => {
      dragging = false;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // Auto-rotate the model (paused while offscreen / hidden / dragging)
    let paused = false;
    const io = new IntersectionObserver(([entry]) => {
      paused = !entry.isIntersecting;
    });
    io.observe(mount);

    const onVisibility = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    let rafId = 0;
    let prev = performance.now();
    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (paused) return;
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      if (dragging) {
        render();
        return;
      }
      pivot.rotation.y += ORBIT_SPEED * dt;
      render();
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      asciiMaterial.dispose();
      quad.geometry.dispose();
      charactersTexture.dispose();
      rt.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} className="turntable-canvas" aria-hidden="true" />
  );
}