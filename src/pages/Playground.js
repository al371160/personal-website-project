import { useEffect, useState } from "react";
import MosaicScroller from "../components/MosaicScroller";
import { buildPlaygroundCollection } from "../data/playground";

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
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(false);
        onProgress?.(70);

        const covers = data
          .flatMap((item) => item.files ?? [])
          .filter((f) => f.type === "image")
          .slice(0, 8);

        if (covers.length === 0) { onReady?.(); return; }

        let remaining = covers.length;
        const done = () => { if (--remaining <= 0) onReady?.(); };
        covers.forEach((f) => {
          const img = new window.Image();
          img.onload = img.onerror = done;
          img.src = f.url;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setItems([]);
        onReady?.();
      });

    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [onReady, onProgress, reloadKey]);

  const tiles = buildPlaygroundCollection(items ?? []);

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

      {tiles.length > 0 && <MosaicScroller tiles={tiles} />}
    </main>
  );
}