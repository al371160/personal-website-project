# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # dev server at localhost:3000
npm run build    # production build
npm test         # run tests (interactive watch mode)
npm test -- --watchAll=false  # run tests once (CI mode)
```

## Architecture

This is a **Create React App** personal portfolio site (React 19, react-router-dom v7). It's an SPA with a custom loading transition system.

### Routing

- `/` → `src/pages/Home.js` — bio/links section + project gallery grid
- `/work/:slug` → `src/pages/Detail.js` — individual project detail page
- `/playground` → `src/pages/Playground.js` — packed cluster of work, sized by each image's pixels
- `/about` → `src/pages/Hobbies.js` — placeholder page

### Playground

`/playground` renders one drag-to-pan cluster (`src/components/MosaicScroller.js`), not a repeating lattice. The viewport is a fixed-size pannable canvas (`touch-action: none`, pointer + wheel handlers). `buildLayout` shelf-packs a single copy of the collection left to right, wrapping so the group is roughly the shape of the viewport, with a thin gutter. Only cards overlapping the viewport are mounted. Pan is applied as a CSS transform (rAF-throttled). Each photo's box is proportional to its real pixel size (measured in `Playground.js` from the cover's `naturalWidth`/`naturalHeight`, or `videoWidth`/`videoHeight`, before the scroller mounts, and stored as `pixelW`/`pixelH`). WebGL tiles have no pixels; their long edge matches the median photo, using `ratio` from `WEBGL_TILES`. The cluster is scaled to fit the viewport with a little padding at zoom 1 and centered; the zoom ceiling is high enough that a small image can still fill the detail view. Tiles come from a unified collection builder, `src/data/playground.js`, which merges:
- `WEBGL_TILES` — local interactive 3D cards (`KoiPond`, `ModelTurntable`); add new ones here (title/description/component).
- Notion projects fetched from `/api/playground` — serverless fn `api/playground.js` (dev: `server.js` route), which reads `NOTION_PLAYGROUND_DB`. The DB uses the same shape as artwork: Name / Date / Description / Image (multi-file).

Every card is interactive: hovering draws a soft outline and clicking any card (project or WebGL) zooms into it with an eased, center-anchored view `{x, y, s}` and shows its title + description in a borderless panel anchored just right of the card's top-right corner (+14px, ~80px down from the card top). The detail zoom level is computed per card so each object's height fills ~75% of the viewport, with the card's top edge pinned ~30px below the viewport top (top-aligned, not centered). Multi-image cards are clicked into the same detail view, where small circular arrow buttons (`onNav`, via `moveDetail`) cycle their files; navigating refits the focused box to the newly shown file's ratio and re-zooms so a taller/wider image always fits (per-file ratios are stored as `` `${tile.id}:${index}` ``, layout boxes follow index 0). Every image keeps its own aspect ratio: the card reports natural dimensions via `onLoad` plus a mount-effect fallback (cached images and videos don't fire `load`, so `complete/naturalWidth` and `videoWidth/videoHeight` are read directly), and while focused the media renders `object-fit: contain` so a swapped-in file is never cropped. WebGL cards are mounted/deloaded by the same proximity `IntersectionObserver` as images (only cards near the viewport create WebGL contexts), pause their render loops while offscreen, and degrade to an empty card if a context can't be created — so panning/zooming through the cluster can't exhaust the browser's context limit or crash. Clicks are gesture-gated: a press that moves ≥5px is treated as pan/rotate, not a click (`gestureRef`). Scroll / trackpad-pinch zooms about the viewport center only; drag pans outside cards; WebGL cards keep their own drags (rotate/stir); pan/zoom are locked while in a detail view, and Escape, the × button, clicking empty space, or re-clicking the focused card zooms back out to the pre-detail view.

### Data

All project content lives in **`src/data/projects.js`** as a plain JS array. Each project has:
- `slug` — URL identifier
- `links?` — `[{url, label?}]`; each renders a button in the detail sidebar under the title (label defaults to “Visit project”)
- `visitUrl?` — shorthand for a single `links` entry with the default label (ignored when `links` is set)
- `thumbnail` — media object (`{type, src}`) shown on the Home gallery card
- `hero` — media object shown full-width at the top of the Detail page
- `meta` — `{role, roleDescription?, collaborators, duration, tools}`
- `content` — array of content blocks rendered sequentially on the Detail page:
  - Media: `{type: "image"|"video"|"photo", src, caption?}` — image/video with optional caption below
  - Text: `{type: "text", title?, body}` — sans-serif prose section (distinct from captions); `body` is a string or paragraph array, optional for a title-only heading
  - Gallery: `{type: "gallery", columns?: 1|2|3, items: [{type, src, caption?}]}` — grid of media with optional per-item captions (defaults to 1 column; multi-column collapses to 1 at ≤800px)
  - Callout: `{type: "callout", icon?, title?, body}` — Lucide icon (kebab-case name, e.g. `"hammer"`, loaded on demand) beside a title and text on a slightly lighter box; for several cards side by side use `{type: "callout", columns?: 1|2|3, items: [{icon?, title?, body}]}` (defaults to 1 column; collapses to 1 at ≤800px)

The project intro (`meta.roleDescription`) is folded into the `Overview` text block as its first paragraph; without an Overview block it renders under the details grid (falling back to `description`). Most projects now write one combined paragraph directly in the Overview body and omit `roleDescription`.

All assets are hosted on Cloudinary (`dak0zi45d`). `src/utils/cloudinary.js` rewrites URLs at render time:
- `optimizeImage` — `c_limit,w_…/f_auto/q_auto` on every image except hero images.
- `optimizeVideo` — `c_limit,w_…/q_auto/vc_h264` MP4 (H.264 output also tone-maps HDR sources to SDR); home cards add `du_8` to preview only the first 8s.
- `videoPoster` — first frame (`so_0`) used as the `<video>` poster.

Videos render through `src/components/VideoPlayer.js` and always start paused: on project pages with a play/pause button (`preload="none"`), on home cards playing only while hovered. New video URLs are transcoded on first request (Cloudinary returns 423 until ready), so request them once after adding a video.

### Loading System

`App.js` wraps routes in a `PageLoader` overlay + `AppContent` component. Readiness is derived per-navigation from `location.key`:
1. A route starts not-ready → the loader overlay is visible (`.app-loading` = opacity 0)
2. Each page calls `onReady()` when its content is ready (Home waits for every card image/video poster; Detail waits for the hero; both via `src/utils/waitForMedia.js`; Artwork waits for the Notion fetch + cover preloads; Playground waits for the Notion fetch and cover pixel measurements)
3. `onReady()` marks the current visit as ready → loader hides and the app fades in (`.app-ready` = opacity 1). Readiness resets on every `location.key` change, including back/forward to an entry that was ready before, since the page remounts and reloads its media.

### Styling

Plain CSS in two files — `src/index.css` (global/loader styles) and `src/App.css` (component/layout styles). No CSS modules or CSS-in-JS. The site uses a dark theme (`#0e0e0e` background, `#ffffff` text) with monospace as the base font family, and sans-serif for body copy.
