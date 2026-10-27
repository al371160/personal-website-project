import { useEffect, useRef } from "react";
import ProjectGallery from "../components/ProjectGallery";
import { COLLECTIONS, collectionProjects } from "../data/projects";
import { waitForMedia } from "../utils/waitForMedia";

export default function Collection({ name, onReady, onProgress }) {
  const pageRef = useRef(null);
  const collection = COLLECTIONS[name];
  const projects = collectionProjects(name);

  useEffect(() => {
    let cancelled = false;
    const container = pageRef.current;
    if (!container) { onProgress?.(100); onReady?.(); return; }

    waitForMedia(container, (p) => { if (!cancelled) onProgress?.(p); })
      .then(() => { if (!cancelled) onReady?.(); });

    const timeout = setTimeout(() => {
      if (!cancelled) { onProgress?.(100); onReady?.(); }
    }, 15000);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [name, onReady, onProgress]);

  if (!collection) {
    return <p>Collection not found.</p>;
  }

  return (
    <main className="page" ref={pageRef}>
      <section className="home-intro">
        <div className="collection-intro">
          <h1 className="collection-title">{collection.title}</h1>
          <p className="intro-copy">{collection.intro}</p>
        </div>
      </section>

      <section className="archive-section">
        <ProjectGallery projects={projects} />
      </section>
    </main>
  );
}
