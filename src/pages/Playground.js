import { useCallback, useEffect, useMemo, useState } from "react";
import SphereImageGrid from "../components/SphereImageGrid";
import { notionSphereImages } from "../data/playground";
import { moreWorkProjects } from "../data/projects";
import { optimizeImage, videoPoster } from "../utils/cloudinary";

const THUMB_WIDTH = 800;

function measureSphereSize() {
  const width = window.innerWidth;
  const height = window.innerHeight - 60;
  return Math.max(280, Math.floor(Math.min(width, height) * 0.92));
}

function useSphereSize() {
  const [size, setSize] = useState(measureSphereSize);

  useEffect(() => {
    const update = () => setSize(measureSphereSize());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

function projectSphereImages() {
  return moreWorkProjects().flatMap((project) => {
    const thumb = project.thumbnail;
    if (!thumb?.src) return [];
    const src = thumb.type === "video"
      ? videoPoster(thumb.src, THUMB_WIDTH)
      : optimizeImage(thumb.src, THUMB_WIDTH);
    if (!src) return [];
    return [{
      id: `work-${project.slug}`,
      src,
      alt: project.title,
      title: project.title,
      href: `/work/${project.slug}`,
    }];
  });
}

export default function Playground({ onReady, onProgress }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const containerSize = useSphereSize();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch("/api/playground", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        onProgress?.(30);
        setItems(data);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setItems([]);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [onProgress, reloadKey]);

  const images = useMemo(() => {
    if (!items) return null;
    return [...notionSphereImages(items), ...projectSphereImages()];
  }, [items]);

  const handleMediaProgress = useCallback((progress) => {
    onProgress?.(Math.round(30 + progress * 0.7));
  }, [onProgress]);

  return (
    <main className="page page-canvas">
      {error && (
        <div className="playground-error subpage-header">
          <p className="subpage-empty">Couldn't reach the playground database.</p>
          <button className="playground-retry" type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      )}

      {images && (
        <div className="sphere-stage">
          <SphereImageGrid
            images={images}
            containerSize={containerSize}
            onReady={onReady}
            onProgress={handleMediaProgress}
          />
        </div>
      )}
    </main>
  );
}
