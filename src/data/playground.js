import KoiPond from "../components/KoiPond";
import ModelTurntable from "../components/ModelTurntable";

// 12-column mosaic pattern. Every group of spans sums to exactly 12 columns,
// so the tiles pack with zero gaps. Sizing is pattern-driven (deterministic),
// making the mosaic look tessellated without needing per-tile layout work.
export const MOSAIC_PATTERN = [
  { c: 4, r: 2 },
  { c: 4, r: 2 },
  { c: 4, r: 2 },
  { c: 6, r: 1 },
  { c: 6, r: 1 },
  { c: 3, r: 2 },
  { c: 3, r: 2 },
  { c: 3, r: 2 },
  { c: 3, r: 2 },
];

// Interactive 3D cards. Each renders inline in the mosaic; clicking zooms in
// and shows the description. `ratio` keeps the card box at the canvas's
// intended aspect ratio (w/h). Add new ones by pushing to this array —
// everything else is wired up automatically.
export const WEBGL_TILES = [
  {
    id: "koi-pond",
    kind: "webgl",
    title: "Koi Pond",
    description:
      "A real-time GPU fluid sim rendered in WebGL2. Drag across the water to stir ripples, caustics, and wakes.",
    component: KoiPond,
    ratio: 460 / 420,
  },
  {
    id: "ascii-model",
    kind: "webgl",
    title: "ASCII Studio",
    description:
      "A three.js turntable under an ASCII dithering post-process. Drag to rotate the object.",
    component: ModelTurntable,
    ratio: 420 / 340,
  },
];

// Merges Notion projects (images + title + date + description) with the local
// 3D cards into one unified tile collection.
export function buildPlaygroundCollection(items = []) {
  const projects = items.map((item) => ({
    id: `pg-${item.id}`,
    kind: "project",
    title: item.title ?? "Untitled",
    date: item.date ?? null,
    description: item.description ?? "",
    files: item.files ?? [],
  }));
  return [...WEBGL_TILES, ...projects];
}