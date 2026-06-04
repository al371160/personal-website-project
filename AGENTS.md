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

This is a **Create React App** personal portfolio site (React 19, react-router-dom v7). It's a two-page SPA with a custom loading transition system.

### Routing

- `/` → `src/pages/Home.js` — bio/links section + project gallery grid
- `/work/:slug` → `src/pages/Detail.js` — individual project detail page

### Data

All project content lives in **`src/data/projects.js`** as a plain JS array. Each project has:
- `slug` — URL identifier
- `thumbnail` — media object (`{type, src}`) shown on the Home gallery card
- `hero` — media object shown full-width at the top of the Detail page
- `meta` — `{role, roleDescription?, collaborators, duration, tools}`
- `content` — array of content blocks rendered sequentially on the Detail page:
  - Media: `{type: "image"|"video"|"photo", src, caption?}` — image/video with optional caption below
  - Text: `{type: "text", title?, body}` — sans-serif prose section (distinct from captions); `body` is a string or paragraph array
  - Gallery: `{type: "gallery", columns?: 1|2|3, items: [{type, src, caption?}]}` — grid of media with optional per-item captions

All assets are hosted on Cloudinary (`dak0zi45d`).

### Loading System

`App.js` wraps routes in a `PageLoader` overlay + `AppContent` component. On every route change:
1. `loading` state is set to `true` — shows the SVG loader overlay and hides the app (`.app-loading` = opacity 0)
2. Each page calls `onReady()` when its content is ready (Home calls immediately; Detail waits for the hero image/video to load)
3. `onReady()` sets `loading` to `false` — hides the loader and fades the app in (`.app-ready` = opacity 1)

### Styling

Plain CSS in two files — `src/index.css` (global/loader styles) and `src/App.css` (component/layout styles). No CSS modules or CSS-in-JS. The site uses a dark theme (`#0e0e0e` background, `#ffffff` text) with monospace as the base font family, and sans-serif for body copy.
