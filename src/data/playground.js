import KoiPond from "../components/KoiPond";
import ModelTurntable from "../components/ModelTurntable";

// Interactive 3D cards. Each renders inline in the cluster; clicking zooms in
// and shows the description. `ratio` is the card's aspect (w/h). These have no
// pixel size, so the layout gives them a long edge equal to the median photo.
// Add new ones by pushing to this array — everything else is wired up.
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
// 3D cards into one unified tile collection. Cover pixel size (measured before
// layout) is `pixelW` / `pixelH` so every photo keeps its real size relative
// to the others.
export function buildPlaygroundCollection(items = []) {
  const projects = items.map((item) => {
    const files = item.files ?? [];
    const cover = files[0];
    return {
      id: `pg-${item.id}`,
      kind: "project",
      title: item.title ?? "Untitled",
      date: item.date ?? null,
      description: item.description ?? "",
      files,
      pixelW: cover?.width > 0 ? cover.width : null,
      pixelH: cover?.height > 0 ? cover.height : null,
    };
  });
  return [...WEBGL_TILES, ...projects];
}