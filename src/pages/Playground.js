import { useEffect, useState } from "react";
import MosaicScroller from "../components/MosaicScroller";
import { buildPlaygroundCollection } from "../data/playground";

const MEASURE_TIMEOUT_MS = 12000;

// Read the cover's real pixel size before layout so a large file stays large
// next to a small one. Videos only need metadata; a timeout falls back to the
// median size in the packer.
function measureFile(file) {
  return new Promise((resolve) => {
    if (!file?.url) {
      resolve(null);
      return;
    }
    let videoEl = null;
    const timer = setTimeout(() => {
      videoEl?.remove();
      resolve(null);
    }, MEASURE_TIMEOUT_MS);
    const finish = (w, h) => {
      clearTimeout(timer);
      resolve(w > 0 && h > 0 ? { width: w, height: h } : null);
    };
    if (file.type === "video") {
      const video = videoEl = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.setAttribute("playsinline", "");
      // Some browsers skip loadedmetadata until the element is in the document.
      video.style.cssText = "position:fixed;width:0;height:0;opacity:0;pointer-events:none";
      document.body.appendChild(video);
      const done = (w, h) => {
        video.remove();
        finish(w, h);
      };
      video.onloadedmetadata = () => done(video.videoWidth, video.videoHeight);
      video.onerror = () => done(0, 0);
      video.src = file.url;
      return;
    }
    const img = new window.Image();
    img.onload = () => finish(img.naturalWidth, img.naturalHeight);
    img.onerror = () => finish(0, 0);
    img.src = file.url;
  });
}

async function measureCovers(items, onProgress) {
  const total = Math.max(items.length, 1);
  let done = 0;
  return Promise.all(
    items.map(async (item) => {
      const files = item.files ?? [];
      const size = files[0] ? await measureFile(files[0]) : null;
      done += 1;
      onProgress?.(70 + Math.round((done / total) * 25));
      if (!size) return item;
      const nextFiles = files.slice();
      nextFiles[0] = { ...files[0], ...size };
      return { ...item, files: nextFiles };
    })
  );
}

export default function Playground({ onReady, onProgress }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch("/api/playground", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(async (data) => {
        if (cancelled) return;
        onProgress?.(70);
        const measured = await measureCovers(data, onProgress);
        if (cancelled) return;
        setItems(measured);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setItems([]);
      });

    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [onProgress, reloadKey]);

  const tiles = items ? buildPlaygroundCollection(items) : [];

  return (
    <main className="page page-canvas">
      {error && (
        <div className="playground-error subpage-header">
          <p className="subpage-empty">Couldn't reach the playground database.</p>
          <button className="playground-retry" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      )}

      {items && (
        <MosaicScroller tiles={tiles} onReady={onReady} />
      )}
    </main>
  );
}