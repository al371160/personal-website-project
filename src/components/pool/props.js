import * as THREE from "three";

/* Procedural stand-ins for every floating prop. Each builder returns
   { group, radius, draft, tumble } where:
   - radius: footprint used for collisions and picking (world units)
   - draft:  how far the origin sits below the water surface (negative = above)
   - tumble: rolls with its motion (balls) instead of turning to face it
   Swap any of them for a real model via MODEL_URLS in PoolScene.js. */

const GITHUB_PATH =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";
const X_PATH =
  "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z";

const SANS = '"DM Sans", "Helvetica Neue", Arial, sans-serif';

function canvasTexture(w, h, draw, { srgb = true, nearest = false } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (nearest) {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
  } else {
    t.anisotropy = 8;
  }
  return t;
}

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const plastic = (color, extra = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15, ...extra });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

/* ───────── rubber duck (faces +x) ───────── */
export function duck() {
  const g = new THREE.Group();
  const yellow = plastic(0xffcf1a);
  const orange = plastic(0xff7a1a);
  const black = plastic(0x111111, { roughness: 0.1 });

  const body = mesh(new THREE.SphereGeometry(0.5, 40, 28), yellow, 0, 0.22, 0);
  body.scale.set(1.15, 0.78, 0.95);
  const tail = mesh(new THREE.ConeGeometry(0.17, 0.36, 24), yellow, -0.55, 0.42, 0);
  tail.rotation.z = 1.05;
  const head = mesh(new THREE.SphereGeometry(0.3, 36, 24), yellow, 0.34, 0.74, 0);
  const beak = mesh(new THREE.SphereGeometry(0.14, 24, 16), orange, 0.64, 0.69, 0);
  beak.scale.set(1.45, 0.5, 1.15);
  const eyeL = mesh(new THREE.SphereGeometry(0.05, 16, 12), black, 0.55, 0.84, 0.14);
  const eyeR = mesh(new THREE.SphereGeometry(0.05, 16, 12), black, 0.55, 0.84, -0.14);
  const wingL = mesh(new THREE.SphereGeometry(0.25, 24, 16), yellow, -0.06, 0.32, 0.42);
  wingL.scale.set(1.25, 0.6, 0.38);
  const wingR = wingL.clone();
  wingR.position.z = -0.42;
  g.add(body, tail, head, beak, eyeL, eyeR, wingL, wingR);
  return { group: g, radius: 0.62, draft: 0.12, tumble: false };
}

/* ───────── life buoy ───────── */
export function buoy() {
  const map = canvasTexture(256, 32, (ctx, w, h) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#f4f1ea" : "#e3352b";
      ctx.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
  const ring = mesh(
    new THREE.TorusGeometry(0.44, 0.15, 24, 64),
    new THREE.MeshPhysicalMaterial({ map, roughness: 0.5, clearcoat: 0.4 })
  );
  ring.rotation.x = Math.PI / 2;
  const rope = mesh(
    new THREE.TorusGeometry(0.44, 0.17, 6, 64),
    new THREE.MeshStandardMaterial({ color: 0xe9e2cf, roughness: 0.9, wireframe: true, transparent: true, opacity: 0.35 })
  );
  rope.rotation.x = Math.PI / 2;
  // invisible solid disc so the hole in the middle is grabbable too
  const pick = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 24), new THREE.MeshBasicMaterial({ visible: false }));
  pick.userData.pickOnly = true;
  const g = new THREE.Group();
  g.add(ring, rope, pick);
  return { group: g, radius: 0.62, draft: 0.05, tumble: false };
}

/* ───────── beach ball ───────── */
export function beachBall() {
  const gores = ["#e8322b", "#f6f4ee", "#f7c21a", "#f6f4ee", "#1f6fe0", "#f6f4ee"];
  const map = canvasTexture(1024, 512, (ctx, w, h) => {
    gores.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect((i * w) / gores.length, 0, w / gores.length + 1, h);
    });
    ctx.fillStyle = "#f6f4ee";
    ctx.fillRect(0, 0, w, h * 0.09);
    ctx.fillRect(0, h * 0.91, w, h * 0.09);
    ctx.fillStyle = "#e8322b";
    ctx.fillRect(0, 0, w, h * 0.035);
  });
  const ball = mesh(
    new THREE.SphereGeometry(0.46, 48, 32),
    new THREE.MeshPhysicalMaterial({ map, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 })
  );
  const g = new THREE.Group();
  g.add(ball);
  return { group: g, radius: 0.47, draft: -0.12, tumble: true };
}

/* ───────── model car (faces +x): glossy black with red racing stripes ───────── */
export function car() {
  const g = new THREE.Group();
  const paint = plastic(0x111214, { roughness: 0.25 });
  const stripe = plastic(0xd7262b, { roughness: 0.25 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0d1724, roughness: 0.05, clearcoat: 1 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 1, roughness: 0.2 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffe58a, emissiveIntensity: 1.5 });

  g.add(mesh(new THREE.BoxGeometry(0.84, 0.18, 0.4), paint, 0, 0.08, 0));
  g.add(mesh(new THREE.BoxGeometry(0.44, 0.16, 0.36), glass, -0.05, 0.25, 0));
  g.add(mesh(new THREE.BoxGeometry(0.46, 0.03, 0.38), paint, -0.05, 0.34, 0));
  // twin racing stripes over the hood/trunk and the roof
  for (const z of [-0.055, 0.055]) {
    g.add(mesh(new THREE.BoxGeometry(0.85, 0.006, 0.05), stripe, 0, 0.173, z));
    g.add(mesh(new THREE.BoxGeometry(0.47, 0.006, 0.05), stripe, -0.05, 0.358, z));
  }
  for (const [x, z] of [[0.27, 0.2], [0.27, -0.2], [-0.27, 0.2], [-0.27, -0.2]]) {
    const w = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 24), tire, x, -0.01, z);
    w.rotation.x = Math.PI / 2;
    const hub = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.085, 16), chrome, x, -0.01, z);
    hub.rotation.x = Math.PI / 2;
    g.add(w, hub);
  }
  g.add(mesh(new THREE.SphereGeometry(0.035, 12, 8), lamp, 0.42, 0.1, 0.12));
  g.add(mesh(new THREE.SphereGeometry(0.035, 12, 8), lamp, 0.42, 0.1, -0.12));
  return { group: g, radius: 0.48, draft: 0.06, tumble: false };
}

/* ───────── erlenmeyer flask ───────── */
export function beaker() {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xe6f8ff, roughness: 0.04, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1,
  });
  const liquid = new THREE.MeshStandardMaterial({ color: 0x2bffa0, emissive: 0x13d27a, emissiveIntensity: 0.7, transparent: true, opacity: 0.85 });
  const marks = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });

  // profile: wide flat base, straight cone up to a narrow neck, flared lip
  const profile = [
    [0.0, -0.12], [0.24, -0.12], [0.265, -0.1], [0.075, 0.3], [0.07, 0.34], [0.07, 0.47], [0.088, 0.5],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(mesh(new THREE.LatheGeometry(profile, 48), glass));

  // liquid fills the lower part of the cone
  const radiusAt = (y) => 0.265 - ((y + 0.1) / 0.4) * (0.265 - 0.075);
  const top = 0.05;
  g.add(mesh(new THREE.CylinderGeometry(radiusAt(top) - 0.012, 0.25, top + 0.115, 40), liquid, 0, (top - 0.115) / 2, 0));
  for (const y of [-0.02, 0.06, 0.14]) {
    const tick = mesh(new THREE.TorusGeometry(radiusAt(y) + 0.002, 0.004, 4, 24, 0.7).rotateX(Math.PI / 2), marks, 0, y, 0);
    tick.rotation.y = 1.2;
    g.add(tick);
  }
  return { group: g, radius: 0.3, draft: 0.1, tumble: false };
}

/* ───────── sparking phone (lies flat, screen up) ───────── */
export function phone() {
  const g = new THREE.Group();
  const screen = canvasTexture(256, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#1b3cff");
    grad.addColorStop(1, "#16d6ff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const rand = rng(9);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,40,120" : "0,0,0"}, 0.6)`;
      ctx.fillRect(0, rand() * h, w, 4 + rand() * 18);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    const cx = w * 0.62;
    const cy = h * 0.4;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let x = cx;
      let y = cy;
      const a = (i / 9) * Math.PI * 2 + rand();
      for (let s = 0; s < 4; s++) {
        x += Math.cos(a + (rand() - 0.5)) * 40;
        y += Math.sin(a + (rand() - 0.5)) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  g.add(mesh(new THREE.BoxGeometry(0.36, 0.045, 0.72), new THREE.MeshStandardMaterial({ color: 0x17191f, metalness: 0.6, roughness: 0.3 })));
  const scr = mesh(
    new THREE.PlaneGeometry(0.32, 0.66),
    new THREE.MeshStandardMaterial({ map: screen, emissive: 0xffffff, emissiveMap: screen, emissiveIntensity: 0.9, roughness: 0.05 }),
    0, 0.024, 0
  );
  scr.rotation.x = -Math.PI / 2;
  g.add(scr);
  return { group: g, radius: 0.42, draft: 0.0, tumble: false, sparkOrigin: new THREE.Vector3(0.12, 0.05, -0.2) };
}

/* ───────── boba ───────── */
export function boba() {
  const g = new THREE.Group();
  const cupMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  const tea = new THREE.MeshStandardMaterial({ color: 0xcf9f72, roughness: 0.4, transparent: true, opacity: 0.8 });
  const pearl = new THREE.MeshPhysicalMaterial({ color: 0x1c0f08, roughness: 0.15, clearcoat: 1 });
  const rand = rng(4);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2;
    const r = rand() * 0.13;
    g.add(mesh(new THREE.SphereGeometry(0.045, 12, 8), pearl, Math.cos(a) * r, -0.22 + rand() * 0.08, Math.sin(a) * r));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.225, 0.18, 0.52, 36), tea, 0, 0.0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.62, 36, 1, true), cupMat, 0, 0.04, 0));
  g.add(mesh(new THREE.SphereGeometry(0.245, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), cupMat, 0, 0.35, 0));
  const straw = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 16), plastic(0x2f7bff), 0.06, 0.45, 0.02);
  straw.rotation.z = -0.15;
  g.add(straw);
  return { group: g, radius: 0.3, draft: 0.2, tumble: false };
}

/* ───────── creeper head (face toward +z) ───────── */
export function creeper() {
  const rand = rng(12);
  const greens = ["#5fbf3a", "#4aa52b", "#71d14b", "#3d8f22", "#8be06a"];
  const skin = (face) =>
    canvasTexture(8, 8, (ctx) => {
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          ctx.fillStyle = greens[Math.floor(rand() * greens.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      if (face) {
        ctx.fillStyle = "#0b0b0b";
        [[1, 2], [2, 2], [1, 3], [2, 3], [5, 2], [6, 2], [5, 3], [6, 3], [3, 4], [4, 4], [2, 5], [3, 5], [4, 5], [5, 5], [2, 6], [5, 6], [2, 7], [5, 7]]
          .forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
      }
    }, { nearest: true });
  const side = new THREE.MeshStandardMaterial({ map: skin(false), roughness: 0.8 });
  const front = new THREE.MeshStandardMaterial({ map: skin(true), roughness: 0.8 });
  const mats = [side, side, side, side, front, side]; // +x -x +y -y +z -z
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mats));
  return { group: g, radius: 0.38, draft: 0.12, tumble: false };
}

/* ───────── very wet stapled résumé ───────── */
export function files() {
  const top = canvasTexture(512, 680, (ctx, w, h) => {
    ctx.fillStyle = "#f2efe6";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#14161c";
    ctx.font = `700 54px ${SANS}`;
    ctx.fillText("RÉSUMÉ", 44, 92);
    ctx.font = `500 24px ${SANS}`;
    ctx.fillText("Alexander Liu", 46, 132);
    const rand = rng(31);
    for (let y = 180; y < h - 40; y += 26) {
      if (rand() < 0.15) {
        y += 14;
        ctx.fillStyle = "#14161c";
        ctx.fillRect(44, y, 140, 10);
        continue;
      }
      ctx.fillStyle = "rgba(20, 22, 28, 0.45)";
      ctx.fillRect(44, y, 180 + rand() * 240, 7);
    }
    // water damage: soaked blotches and bleeding ink
    for (let i = 0; i < 14; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 30 + rand() * 90;
      const gr = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
      gr.addColorStop(0, "rgba(120, 140, 160, 0.22)");
      gr.addColorStop(0.8, "rgba(120, 140, 160, 0.12)");
      gr.addColorStop(1, "rgba(80, 100, 130, 0.0)");
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = "blur(3px)";
    ctx.fillStyle = "rgba(40, 70, 160, 0.25)";
    ctx.fillRect(40, 300, 300, 40);
    ctx.filter = "none";
  });
  const paper = new THREE.MeshPhysicalMaterial({ color: 0xe8e4da, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const topMat = new THREE.MeshPhysicalMaterial({ map: top, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const g = new THREE.Group();
  const rand = rng(5);
  for (let i = 0; i < 4; i++) {
    const sheet = mesh(new THREE.BoxGeometry(0.62, 0.012, 0.82), paper, (rand() - 0.5) * 0.05, i * 0.014, (rand() - 0.5) * 0.05);
    sheet.rotation.y = (rand() - 0.5) * 0.12;
    if (i === 3) {
      // printed face as its own plane so the text reads the right way up from above
      const face = mesh(new THREE.PlaneGeometry(0.62, 0.82), topMat, 0, 0.0065, 0);
      face.rotation.x = -Math.PI / 2;
      sheet.add(face);
    }
    g.add(sheet);
  }
  const steel = new THREE.MeshStandardMaterial({ color: 0xcfd6de, metalness: 1, roughness: 0.25 });
  const staple = mesh(new THREE.BoxGeometry(0.1, 0.008, 0.012), steel, -0.22, 0.058, -0.32);
  staple.rotation.y = 0.6;
  g.add(staple);
  return { group: g, radius: 0.52, draft: 0.0, tumble: false };
}

/* ───────── logo ball: logo printed on the top hemisphere ───────── */
const LOGOS = {
  github: { bg: "#111111", draw: (ctx, s) => drawPath(ctx, GITHUB_PATH, s, "#ffffff", 0.5) },
  x: { bg: "#0b0b0b", draw: (ctx, s) => drawPath(ctx, X_PATH, s, "#ffffff", 0.42) },
  linkedin: {
    bg: "#0a66c2",
    draw: (ctx, s) => {
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${s * 0.42}px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("in", s / 2 + 4, s / 2 + 8);
    },
  },
  gmail: {
    bg: "#f7f7f7",
    draw: (ctx, s) => {
      const l = s * 0.3;
      const r = s * 0.7;
      const t = s * 0.36;
      const b = s * 0.66;
      ctx.lineWidth = s * 0.06;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const seg = (color, pts) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      };
      seg("#4285f4", [[l, b], [l, t]]);
      seg("#34a853", [[r, t], [r, b]]);
      seg("#ea4335", [[l, t], [s / 2, s * 0.52], [r, t]]);
      seg("#fbbc04", [[r - s * 0.02, t], [r, t]]);
    },
  },
  itch: {
    bg: "#fa5c5c",
    draw: (ctx, s) => {
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${s * 0.2}px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("itch.io", s / 2, s / 2 + 4);
    },
  },
};

function drawPath(ctx, d, s, color, frac) {
  const size = s * frac;
  ctx.save();
  ctx.translate(s / 2 - size / 2, s / 2 - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(d));
  ctx.restore();
}

export function logoBall(kind) {
  const logo = LOGOS[kind];
  const r = 0.3;
  const map = canvasTexture(512, 512, (ctx, s) => {
    ctx.fillStyle = logo.bg;
    ctx.fillRect(0, 0, s, s);
    logo.draw(ctx, s);
  });
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  // planar projection from above so the logo reads from the camera
  const geo = new THREE.SphereGeometry(r, 48, 32);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, 0.5 + (pos.getX(i) / (2 * r)) * 0.95, 0.5 - (pos.getZ(i) / (2 * r)) * 0.95);
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 })));
  return { group: g, radius: 0.32, draft: -0.04, tumble: false };
}
